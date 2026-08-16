import {useCallback, useEffect, useRef, useState} from "react";
import {useAuth} from "@clerk/expo";
import type Ably from "ably";
import {
    advanceOneWinnerStage,
    eliminateOneWinnerStage,
    endOneWinnerEpreuve,
    fetchOneWinnerGame,
    joinOneWinnerGame,
    OneWinnerAnswerSummary,
    OneWinnerGameSummary,
    recordOneWinnerBuzz,
    setOneWinnerConnection,
    startOneWinnerEpreuve,
    startOneWinnerGame,
    SubmitOneWinnerAnswerInput,
    submitOneWinnerAnswer as submitOneWinnerAnswerRequest,
} from "@/lib/oneWinnerApi";
import {createOneWinnerAblyClient, oneWinnerChannelName} from "@/lib/oneWinnerAbly";
import {ALL_QUESTIONS} from "@/data/questions";
import {nextEpreuveKind, pickEpreuveQuestions} from "@/game/oneWinnerQuestionPicker";

export const ONE_WINNER_MIN_PLAYERS = 4;
export const ONE_WINNER_MAX_PLAYERS = 6;

const REALTIME_EVENTS = [
    "player-joined",
    "match-started",
    "epreuve-started",
    "epreuve-ended",
    "buzz",
    "answer",
    "elimination",
    "stage-advanced",
    "player-forfeited",
    "connection-changed",
];

// Confirme périodiquement "je suis toujours là" — déclenche aussi côté serveur le balayage des
// forfaits par déconnexion pour TOUS les joueurs (voir POST /api/games/[id]/connection), donc même un
// joueur qui ne change jamais d'état bénéficie du balayage tant qu'au moins un autre envoie un battement.
const CONNECTION_HEARTBEAT_MS = 20_000;

export interface UseOneWinnerGame {
    game: OneWinnerGameSummary | null;
    isLoading: boolean;
    error: string | null;
    myId: string | null;
    isHost: boolean;
    canStart: boolean;
    isStarting: boolean;
    start: () => Promise<void>;
    startNextEpreuve: () => Promise<void>;
    endEpreuve: () => Promise<void>;
    eliminate: () => Promise<void>;
    advance: () => Promise<void>;
    buzz: (questionId: string) => Promise<void>;
    answer: (input: SubmitOneWinnerAnswerInput) => Promise<OneWinnerAnswerSummary>;
}

/** Rejoint la partie (idempotent) puis maintient son état à jour en direct via Ably jusqu'à la fin. */
export function useOneWinnerGame(gameId: string): UseOneWinnerGame {
    const {userId, getToken} = useAuth();
    const [game, setGame] = useState<OneWinnerGameSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const tokenRef = useRef<string | null>(null);
    // Questions déjà utilisées dans CETTE partie, côté hôte uniquement — évite les répétitions tant que
    // l'appareil hôte reste monté ; pas de suivi côté serveur pour cette version.
    const usedQuestionIdsRef = useRef<Set<string>>(new Set());

    const getFreshToken = useCallback(async () => {
        const token = tokenRef.current ?? (await getToken());
        if (!token) throw new Error("Non connecté");
        tokenRef.current = token;
        return token;
    }, [getToken]);

    const refresh = useCallback(async () => {
        const token = await getFreshToken();
        const data = await fetchOneWinnerGame(token, gameId);
        setGame(data);
        return data;
    }, [getFreshToken, gameId]);

    useEffect(() => {
        let cancelled = false;
        let ably: Ably.Realtime | null = null;
        let heartbeat: ReturnType<typeof setInterval> | null = null;
        // Évite de renvoyer le même état en boucle à chaque changement transitoire ("connecting", etc.).
        let lastReportedConnected: boolean | null = null;
        let currentToken: string | null = null;

        const reportConnection = (isConnected: boolean) => {
            if (!currentToken || lastReportedConnected === isConnected) return;
            lastReportedConnected = isConnected;
            setOneWinnerConnection(currentToken, gameId, isConnected).catch(() => {
                // Ignoré volontairement — un battement manqué n'est jamais bloquant, le suivant rattrape.
            });
        };

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = await getFreshToken();
                currentToken = token;

                try {
                    await joinOneWinnerGame(token, gameId);
                } catch {
                    // Échoue silencieusement si la partie a déjà démarré : on tente quand même de
                    // charger l'état, ce qui réussira si l'appelant en faisait déjà partie.
                }

                const data = await fetchOneWinnerGame(token, gameId);
                if (cancelled) return;
                setGame(data);

                ably = createOneWinnerAblyClient(token, gameId);
                const channel = ably.channels.get(oneWinnerChannelName(gameId));
                channel.subscribe(REALTIME_EVENTS, () => {
                    if (!cancelled) refresh();
                });

                // L'état de connexion Ably reflète directement si CET appareil peut recevoir/envoyer les
                // mises à jour temps réel — signal plus fiable qu'un simple événement de premier/arrière-plan.
                ably.connection.on((stateChange) => {
                    if (cancelled) return;
                    if (stateChange.current === "connected") reportConnection(true);
                    else if (["disconnected", "suspended", "failed", "closed"].includes(stateChange.current)) reportConnection(false);
                });

                heartbeat = setInterval(() => {
                    if (!cancelled) reportConnection(true);
                }, CONNECTION_HEARTBEAT_MS);
            } catch (caughtError) {
                if (!cancelled) setError((caughtError as Error).message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            if (heartbeat) clearInterval(heartbeat);
            ably?.close();
            if (currentToken) {
                setOneWinnerConnection(currentToken, gameId, false).catch(() => {});
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId]);

    const isHost = !!userId && game?.players[0]?.id === userId;
    const canStart = isHost && game?.phase === "lobby" && (game?.players.length ?? 0) >= ONE_WINNER_MIN_PLAYERS;

    const start = useCallback(async () => {
        const token = await getFreshToken();
        setIsStarting(true);
        try {
            await startOneWinnerGame(token, gameId);
            await refresh();
        } finally {
            setIsStarting(false);
        }
    }, [getFreshToken, gameId, refresh]);

    const startNextEpreuve = useCallback(async () => {
        if (!game) return;
        const kind = nextEpreuveKind(game.stageId, game.epreuvesPlayedInStage);
        if (!kind) return;

        const questionIds = pickEpreuveQuestions(ALL_QUESTIONS, kind, [...usedQuestionIdsRef.current]);
        questionIds.forEach((id) => usedQuestionIdsRef.current.add(id));

        const token = await getFreshToken();
        await startOneWinnerEpreuve(token, gameId, questionIds);
        await refresh();
    }, [game, getFreshToken, gameId, refresh]);

    const endEpreuve = useCallback(async () => {
        const token = await getFreshToken();
        await endOneWinnerEpreuve(token, gameId);
        await refresh();
    }, [getFreshToken, gameId, refresh]);

    const eliminate = useCallback(async () => {
        const token = await getFreshToken();
        await eliminateOneWinnerStage(token, gameId);
        await refresh();
    }, [getFreshToken, gameId, refresh]);

    const advance = useCallback(async () => {
        const token = await getFreshToken();
        await advanceOneWinnerStage(token, gameId);
        await refresh();
    }, [getFreshToken, gameId, refresh]);

    const buzz = useCallback(
        async (questionId: string) => {
            const token = await getFreshToken();
            await recordOneWinnerBuzz(token, gameId, questionId);
            await refresh();
        },
        [getFreshToken, gameId, refresh],
    );

    const answer = useCallback(
        async (input: SubmitOneWinnerAnswerInput) => {
            const token = await getFreshToken();
            const result = await submitOneWinnerAnswerRequest(token, gameId, input);
            await refresh();
            return result;
        },
        [getFreshToken, gameId, refresh],
    );

    return {
        game,
        isLoading,
        error,
        myId: userId ?? null,
        isHost,
        canStart: !!canStart,
        isStarting,
        start,
        startNextEpreuve,
        endEpreuve,
        eliminate,
        advance,
        buzz,
        answer,
    };
}
