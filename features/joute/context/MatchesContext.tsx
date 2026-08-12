import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer} from "react";
import {Match} from "@/game/types";
import {applyExpiration, computeOutcomeForPlayer} from "@/game/rules";
import {localMatchRepository} from "@/services/localMatchRepository";
import {GhostOpponentDriver} from "@/services/opponentDriver";
import {localNotificationService} from "@/services/localNotificationService";
import {ALL_QUESTIONS} from "@/data/questions";
import ghosts from "@/data/ghosts";
import {useCurrentPlayer} from "../hooks/useCurrentPlayer";

const GHOST_IDS = new Set(ghosts.map((ghost) => ghost.id));

/** Applique l'expiration et, le cas échéant, fait jouer le fantôme dont c'est le tour — calculé à la lecture, comme l'expiration. */
function reconcileMatch(match: Match, now: number): Match {
    const afterExpiration = applyExpiration(match, now);
    if (afterExpiration.status !== "active") return afterExpiration;
    if (!GHOST_IDS.has(afterExpiration.currentTurnPlayerId)) return afterExpiration;

    const nextTurnAt = GhostOpponentDriver.computeNextTurnAt(afterExpiration, afterExpiration.currentTurnPlayerId);
    if (now < nextTurnAt) return afterExpiration;

    return GhostOpponentDriver.playTurn(afterExpiration, afterExpiration.currentTurnPlayerId, ALL_QUESTIONS, now);
}

const RESULT_LABELS: Record<"win" | "loss" | "draw", string> = {
    win: "Tu as gagné !",
    loss: "Tu as perdu.",
    draw: "Match nul !",
};

/** Déclenche les notifications locales "c'est ton tour" / "partie terminée" et gère le rappel à 6h en comparant l'état avant/après une mise à jour. */
async function notifyOnTransition(previous: Match | undefined, next: Match, myId: string): Promise<void> {
    if (!myId) return;

    // Les notifications sont un confort, jamais un chemin critique : une erreur ici (permission refusée,
    // module natif indisponible dans Expo Go, etc.) ne doit jamais empêcher de charger/sauvegarder une partie.
    try {
        const wasFinished = previous ? previous.status === "completed" || previous.status === "expired" : false;
        const isFinished = next.status === "completed" || next.status === "expired";
        if (!wasFinished && isFinished) {
            const outcome = computeOutcomeForPlayer(next, myId);
            const resultLabel = outcome === null ? "Partie annulée." : RESULT_LABELS[outcome];
            await localNotificationService.notifyMatchFinished({matchId: next.id, resultLabel});
            await localNotificationService.cancelExpiringSoon(next.id);
            return;
        }

        const wasMyTurn = previous ? previous.status === "active" && previous.currentTurnPlayerId === myId : false;
        const isMyTurn = next.status === "active" && next.currentTurnPlayerId === myId;

        if (isMyTurn && !wasMyTurn) {
            const opponent = next.players.find((player) => player.id !== myId);
            await localNotificationService.notifyYourTurn({matchId: next.id, opponentName: opponent?.displayName ?? "Ton adversaire"});
        }

        if (isMyTurn) {
            await localNotificationService.scheduleExpiringSoon({matchId: next.id, expiresAt: next.expiresAt});
        } else if (wasMyTurn) {
            await localNotificationService.cancelExpiringSoon(next.id);
        }
    } catch {
        // Ignoré volontairement — voir le commentaire ci-dessus.
    }
}

interface MatchesState {
    matches: Record<string, Match>;
    isLoading: boolean;
}

type MatchesAction =
    | {type: "loading"}
    | {type: "loaded"; matches: Match[]}
    | {type: "upsert"; match: Match};

function matchesReducer(state: MatchesState, action: MatchesAction): MatchesState {
    switch (action.type) {
        case "loading":
            return {...state, isLoading: true};
        case "loaded": {
            const matches: Record<string, Match> = {};
            for (const match of action.matches) matches[match.id] = match;
            return {matches, isLoading: false};
        }
        case "upsert":
            return {...state, matches: {...state.matches, [action.match.id]: action.match}};
    }
}

interface MatchesContextValue {
    matches: Match[];
    isLoading: boolean;
    refresh: () => Promise<void>;
    saveMatch: (match: Match) => Promise<void>;
}

const MatchesContext = createContext<MatchesContextValue | undefined>(undefined);

export const MatchesProvider = ({children}: {children: ReactNode}) => {
    const {id: myId} = useCurrentPlayer();
    const [state, dispatch] = useReducer(matchesReducer, {matches: {}, isLoading: true});

    const refresh = useCallback(async () => {
        dispatch({type: "loading"});
        const stored = await localMatchRepository.list();
        const now = Date.now();
        const reconciled = await Promise.all(
            stored.map(async (match) => {
                const next = reconcileMatch(match, now);
                if (next !== match) {
                    await localMatchRepository.save(next);
                    await notifyOnTransition(match, next, myId);
                }
                return next;
            }),
        );
        dispatch({type: "loaded", matches: reconciled});
    }, [myId]);

    const saveMatch = useCallback(
        async (match: Match) => {
            const previous = state.matches[match.id];
            await localMatchRepository.save(match);
            await notifyOnTransition(previous, match, myId);
            dispatch({type: "upsert", match});
        },
        [myId, state.matches],
    );

    useEffect(() => {
        refresh();
    }, [refresh]);

    const value = useMemo<MatchesContextValue>(
        () => ({matches: Object.values(state.matches), isLoading: state.isLoading, refresh, saveMatch}),
        [state, refresh, saveMatch],
    );

    return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>;
};

export function useMatchesContext(): MatchesContextValue {
    const context = useContext(MatchesContext);
    if (!context) {
        throw new Error("useMatchesContext doit être utilisé à l'intérieur d'un MatchesProvider");
    }
    return context;
}
