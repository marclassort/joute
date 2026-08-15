import {useCallback, useEffect, useRef, useState} from "react";
import {useAuth} from "@clerk/expo";
import type Ably from "ably";
import {fetchOneWinnerGame, joinOneWinnerGame, OneWinnerGameSummary, startOneWinnerGame} from "@/lib/oneWinnerApi";
import {createOneWinnerAblyClient, oneWinnerChannelName} from "@/lib/oneWinnerAbly";

export const ONE_WINNER_MIN_PLAYERS = 4;
export const ONE_WINNER_MAX_PLAYERS = 6;

export interface UseOneWinnerLobby {
    game: OneWinnerGameSummary | null;
    isLoading: boolean;
    error: string | null;
    isHost: boolean;
    canStart: boolean;
    isStarting: boolean;
    start: () => Promise<void>;
}

/** Rejoint la partie (idempotent) puis maintient son état à jour en direct via Ably. */
export function useOneWinnerLobby(gameId: string): UseOneWinnerLobby {
    const {userId, getToken} = useAuth();
    const [game, setGame] = useState<OneWinnerGameSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const tokenRef = useRef<string | null>(null);

    const refresh = useCallback(async () => {
        const token = tokenRef.current ?? (await getToken());
        if (!token) return;
        const data = await fetchOneWinnerGame(token, gameId);
        setGame(data);
    }, [getToken, gameId]);

    useEffect(() => {
        let cancelled = false;
        let ably: Ably.Realtime | null = null;

        (async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = await getToken();
                if (!token) throw new Error("Vous devez être connecté pour rejoindre une partie.");
                tokenRef.current = token;

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
                channel.subscribe(["player-joined", "match-started"], () => {
                    if (!cancelled) refresh();
                });
            } catch (caughtError) {
                if (!cancelled) setError((caughtError as Error).message);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
            ably?.close();
        };
    }, [gameId, getToken, refresh]);

    const isHost = !!userId && game?.players[0]?.id === userId;
    const canStart = isHost && game?.phase === "lobby" && (game?.players.length ?? 0) >= ONE_WINNER_MIN_PLAYERS;

    const start = useCallback(async () => {
        const token = tokenRef.current ?? (await getToken());
        if (!token) return;
        setIsStarting(true);
        try {
            await startOneWinnerGame(token, gameId);
            await refresh();
        } finally {
            setIsStarting(false);
        }
    }, [getToken, gameId, refresh]);

    return {game, isLoading, error, isHost, canStart: !!canStart, isStarting, start};
}
