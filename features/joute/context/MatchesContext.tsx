import React, {createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useReducer} from "react";
import {Match} from "@/game/types";
import {applyExpiration} from "@/game/rules";
import {localMatchRepository} from "@/services/localMatchRepository";
import {GhostOpponentDriver} from "@/services/opponentDriver";
import {ALL_QUESTIONS} from "@/data/questions";
import ghosts from "@/data/ghosts";

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
    const [state, dispatch] = useReducer(matchesReducer, {matches: {}, isLoading: true});

    const refresh = useCallback(async () => {
        dispatch({type: "loading"});
        const stored = await localMatchRepository.list();
        const now = Date.now();
        const reconciled = await Promise.all(
            stored.map(async (match) => {
                const next = reconcileMatch(match, now);
                if (next !== match) await localMatchRepository.save(next);
                return next;
            }),
        );
        dispatch({type: "loaded", matches: reconciled});
    }, []);

    const saveMatch = useCallback(async (match: Match) => {
        await localMatchRepository.save(match);
        dispatch({type: "upsert", match});
    }, []);

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
