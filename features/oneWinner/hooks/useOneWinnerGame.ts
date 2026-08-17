import {useCallback, useEffect, useRef, useState} from "react";
import {useAuth} from "@clerk/expo";
import type Ably from "ably";
import {
    advanceOneWinnerGame,
    chooseChargeTheme as chooseChargeThemeRequest,
    fetchOneWinnerGame,
    joinOneWinnerGame,
    OneWinnerAuth,
    OneWinnerGameSummary,
    setOneWinnerConnection,
    startOneWinnerGame,
    startOneWinnerRound,
    submitChargeAnswer as submitChargeAnswerRequest,
    submitJouteAnswer as submitJouteAnswerRequest,
    submitMeleeAnswer as submitMeleeAnswerRequest,
    SubmitChargeAnswerInput,
    SubmitJouteAnswerInput,
    SubmitMeleeAnswerInput,
} from "@/lib/oneWinnerApi";
import {createOneWinnerAblyClient, oneWinnerChannelName} from "@/lib/oneWinnerAbly";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";

export const ONE_WINNER_PLAYERS = 4;

const REALTIME_EVENTS = [
    "player-joined",
    "match-started",
    "round-started",
    "melee-answer",
    "charge-theme-chosen",
    "charge-answer",
    "joute-answer",
    "match-completed",
    "advanced",
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
    /** Démarre la manche courante — questionIds requis pour la Mêlée/la Joute, absent pour la Charge. */
    startRound: (questionIds?: string[]) => Promise<void>;
    /** Fait avancer la partie d'un cran depuis là où elle en est (voir POST .../advance côté backend). */
    advance: () => Promise<void>;
    answerMelee: (input: SubmitMeleeAnswerInput) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
    chooseChargeTheme: (theme: string) => Promise<void>;
    answerCharge: (input: SubmitChargeAnswerInput) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
    answerJoute: (input: SubmitJouteAnswerInput) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
}

/** Rejoint la partie (idempotent) puis maintient son état à jour en direct via Ably jusqu'à la fin.
 * Jouable sans compte : un invité s'authentifie via son identité locale (services/guestIdentity.ts)
 * plutôt qu'un jeton Clerk — voir OneWinnerAuth dans lib/oneWinnerApi.ts. */
export function useOneWinnerGame(gameId: string): UseOneWinnerGame {
    const {getToken} = useAuth();
    const player = useCurrentPlayer();
    const [game, setGame] = useState<OneWinnerGameSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const authRef = useRef<OneWinnerAuth | null>(null);

    const getFreshAuth = useCallback(async (): Promise<OneWinnerAuth> => {
        if (player.isGuest) {
            if (!player.id) throw new Error("Identité invité non prête");
            const auth: OneWinnerAuth = {kind: "guest", guestId: player.id, displayName: player.displayName};
            authRef.current = auth;
            return auth;
        }
        const cached = authRef.current?.kind === "clerk" ? authRef.current.token : null;
        const token = cached ?? (await getToken());
        if (!token) throw new Error("Non connecté");
        const auth: OneWinnerAuth = {kind: "clerk", token};
        authRef.current = auth;
        return auth;
    }, [player.isGuest, player.id, player.displayName, getToken]);

    const refresh = useCallback(async () => {
        const auth = await getFreshAuth();
        const data = await fetchOneWinnerGame(auth, gameId);
        setGame(data);
        return data;
    }, [getFreshAuth, gameId]);

    useEffect(() => {
        if (!player.isReady) return;

        let cancelled = false;
        let ably: Ably.Realtime | null = null;
        let heartbeat: ReturnType<typeof setInterval> | null = null;
        // Évite de renvoyer le même état en boucle à chaque changement transitoire ("connecting", etc.).
        let lastReportedConnected: boolean | null = null;
        let currentAuth: OneWinnerAuth | null = null;

        const reportConnection = (isConnected: boolean) => {
            if (!currentAuth || lastReportedConnected === isConnected) return;
            lastReportedConnected = isConnected;
            setOneWinnerConnection(currentAuth, gameId, isConnected).catch(() => {
                // Ignoré volontairement — un battement manqué n'est jamais bloquant, le suivant rattrape.
            });
        };

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const auth = await getFreshAuth();
                currentAuth = auth;

                try {
                    await joinOneWinnerGame(auth, gameId);
                } catch {
                    // Échoue silencieusement si la partie a déjà démarré : on tente quand même de
                    // charger l'état, ce qui réussira si l'appelant en faisait déjà partie.
                }

                const data = await fetchOneWinnerGame(auth, gameId);
                if (cancelled) return;
                setGame(data);

                ably = createOneWinnerAblyClient(auth, gameId);
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
            if (currentAuth) {
                setOneWinnerConnection(currentAuth, gameId, false).catch(() => {});
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, player.isReady]);

    const isHost = !!player.id && game?.players[0]?.id === player.id;
    const canStart = isHost && game?.phase === "lobby" && game?.players.length === ONE_WINNER_PLAYERS;

    const start = useCallback(async () => {
        const auth = await getFreshAuth();
        setIsStarting(true);
        try {
            await startOneWinnerGame(auth, gameId);
            await refresh();
        } finally {
            setIsStarting(false);
        }
    }, [getFreshAuth, gameId, refresh]);

    const startRound = useCallback(
        async (questionIds?: string[]) => {
            const auth = await getFreshAuth();
            await startOneWinnerRound(auth, gameId, questionIds);
            await refresh();
        },
        [getFreshAuth, gameId, refresh],
    );

    const advance = useCallback(async () => {
        const auth = await getFreshAuth();
        await advanceOneWinnerGame(auth, gameId);
        await refresh();
    }, [getFreshAuth, gameId, refresh]);

    const answerMelee = useCallback(
        async (input: SubmitMeleeAnswerInput) => {
            const auth = await getFreshAuth();
            const result = await submitMeleeAnswerRequest(auth, gameId, input);
            await refresh();
            return result;
        },
        [getFreshAuth, gameId, refresh],
    );

    const chooseChargeTheme = useCallback(
        async (theme: string) => {
            const auth = await getFreshAuth();
            await chooseChargeThemeRequest(auth, gameId, theme);
            await refresh();
        },
        [getFreshAuth, gameId, refresh],
    );

    const answerCharge = useCallback(
        async (input: SubmitChargeAnswerInput) => {
            const auth = await getFreshAuth();
            const result = await submitChargeAnswerRequest(auth, gameId, input);
            await refresh();
            return result;
        },
        [getFreshAuth, gameId, refresh],
    );

    const answerJoute = useCallback(
        async (input: SubmitJouteAnswerInput) => {
            const auth = await getFreshAuth();
            const result = await submitJouteAnswerRequest(auth, gameId, input);
            await refresh();
            return result;
        },
        [getFreshAuth, gameId, refresh],
    );

    return {
        game,
        isLoading,
        error,
        myId: player.id || null,
        isHost,
        canStart: !!canStart,
        isStarting,
        start,
        startRound,
        advance,
        answerMelee,
        chooseChargeTheme,
        answerCharge,
        answerJoute,
    };
}
