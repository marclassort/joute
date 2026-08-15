import * as Ably from "ably";
import {fetchOneWinnerAblyToken} from "./oneWinnerApi";

export function oneWinnerChannelName(gameId: string): string {
    return `game:${gameId}`;
}

/**
 * Le client ne connaît jamais de clé Ably : le token est délivré par le backend
 * (GET /api/games/[id]/token), scopé en lecture seule sur le canal de cette partie.
 */
export function createOneWinnerAblyClient(token: string, gameId: string): Ably.Realtime {
    return new Ably.Realtime({
        authCallback: (_params, callback) => {
            fetchOneWinnerAblyToken(token, gameId)
                .then((tokenRequest) => callback(null, tokenRequest))
                .catch((error) => callback(error as Ably.ErrorInfo, null));
        },
    });
}
