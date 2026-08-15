const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface OneWinnerPlayerSummary {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isEliminated: boolean;
    isConnected: boolean;
    finalRank: number | null;
}

export interface OneWinnerGameSummary {
    id: string;
    status: "active" | "completed" | "abandoned";
    phase: "lobby" | "intro" | "epreuve" | "classement" | "elimination" | "termine";
    stageId: "main" | "semifinal" | "final";
    winnerId: string | null;
    players: OneWinnerPlayerSummary[];
    currentEpreuve: {kind: "defi" | "buzzer" | "conquete"; questionIds: string[]; startedAt: string} | null;
    standings: {playerId: string; score: number; rank: number}[] | null;
}

export interface AblyTokenRequest {
    keyName: string;
    clientId: string;
    ttl: number;
    timestamp: number;
    capability: string;
    nonce: string;
    mac: string;
}

class OneWinnerApiError extends Error {}

async function gameFetch<T>(token: string, path: string, options: RequestInit = {}): Promise<T> {
    if (!API_BASE_URL) {
        throw new OneWinnerApiError("EXPO_PUBLIC_API_BASE_URL n'est pas configuré");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers},
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new OneWinnerApiError(body?.error ?? `Requête échouée (${response.status})`);
    }
    return body as T;
}

export async function createOneWinnerGame(token: string): Promise<{id: string}> {
    return gameFetch(token, "/api/games", {method: "POST"});
}

export async function joinOneWinnerGame(token: string, gameId: string): Promise<void> {
    await gameFetch(token, `/api/games/${gameId}/join`, {method: "POST"});
}

export async function startOneWinnerGame(token: string, gameId: string): Promise<{phase: string}> {
    return gameFetch(token, `/api/games/${gameId}/start`, {method: "POST"});
}

export async function fetchOneWinnerGame(token: string, gameId: string): Promise<OneWinnerGameSummary> {
    return gameFetch(token, `/api/games/${gameId}`);
}

export async function fetchOneWinnerAblyToken(token: string, gameId: string): Promise<AblyTokenRequest> {
    return gameFetch(token, `/api/games/${gameId}/token`);
}

export function buildOneWinnerLink(gameId: string): string {
    return `joute://one-winner/${gameId}`;
}
