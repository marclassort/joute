import {EpreuveKind, OneWinnerPhase, OneWinnerStageId} from "@/game/oneWinnerTypes";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface OneWinnerPlayerSummary {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isEliminated: boolean;
    isConnected: boolean;
    finalRank: number | null;
}

export interface OneWinnerAnswerSummary {
    playerId: string;
    questionId: string;
    isCorrect: boolean;
    pointsAwarded: number;
}

export interface OneWinnerStanding {
    playerId: string;
    score: number;
    rank: number;
}

export interface OneWinnerElimination {
    stageId: OneWinnerStageId;
    standings: OneWinnerStanding[];
    eliminatedPlayerIds: string[];
    decidedAt: number;
}

export interface OneWinnerGameSummary {
    id: string;
    status: "active" | "completed" | "abandoned";
    phase: OneWinnerPhase;
    stageId: OneWinnerStageId;
    winnerId: string | null;
    epreuvesPlayedInStage: number;
    stageEpreuveCount: number;
    players: OneWinnerPlayerSummary[];
    currentEpreuve: {
        kind: EpreuveKind;
        questionIds: string[];
        startedAt: number;
        answers: OneWinnerAnswerSummary[];
        buzzHolder: string | null;
    } | null;
    liveStandings: OneWinnerStanding[];
    latestElimination: OneWinnerElimination | null;
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

export async function startOneWinnerEpreuve(token: string, gameId: string, questionIds: string[]): Promise<{epreuveId: number; kind: EpreuveKind}> {
    return gameFetch(token, `/api/games/${gameId}/epreuve`, {method: "POST", body: JSON.stringify({questionIds})});
}

export async function endOneWinnerEpreuve(token: string, gameId: string): Promise<{phase: string}> {
    return gameFetch(token, `/api/games/${gameId}/end-epreuve`, {method: "POST"});
}

export async function recordOneWinnerBuzz(token: string, gameId: string, questionId: string): Promise<void> {
    await gameFetch(token, `/api/games/${gameId}/buzz`, {
        method: "POST",
        body: JSON.stringify({questionId, clientReportedAt: Date.now()}),
    });
}

export interface SubmitOneWinnerAnswerInput {
    questionId: string;
    selectedIndex: number | null;
    elapsedMs: number;
    wager?: number | null;
}

export async function submitOneWinnerAnswer(token: string, gameId: string, input: SubmitOneWinnerAnswerInput): Promise<OneWinnerAnswerSummary> {
    return gameFetch(token, `/api/games/${gameId}/answer`, {method: "POST", body: JSON.stringify(input)});
}

export async function eliminateOneWinnerStage(token: string, gameId: string): Promise<OneWinnerElimination> {
    return gameFetch(token, `/api/games/${gameId}/eliminate`, {method: "POST"});
}

export async function advanceOneWinnerStage(
    token: string,
    gameId: string,
): Promise<{phase: string; stageId: OneWinnerStageId; status: string; winnerId: string | null}> {
    return gameFetch(token, `/api/games/${gameId}/advance`, {method: "POST"});
}

/** Un joueur ne peut reporter que SA PROPRE connexion (le userId vient du jeton, jamais du body) — voir
 * POST /api/games/[id]/connection côté backend. */
export async function setOneWinnerConnection(token: string, gameId: string, isConnected: boolean): Promise<void> {
    await gameFetch(token, `/api/games/${gameId}/connection`, {method: "POST", body: JSON.stringify({isConnected})});
}

export function buildOneWinnerLink(gameId: string): string {
    return `joute://one-winner/${gameId}`;
}
