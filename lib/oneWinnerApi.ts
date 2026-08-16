import {EpreuveKind, OneWinnerPhase, OneWinnerStageId} from "@/game/oneWinnerTypes";
import {LeagueTier} from "@/game/oneWinnerRankingTypes";

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

export interface OneWinnerRatingChange {
    playerId: string;
    ratingBefore: number;
    ratingAfter: number;
    delta: number;
    tier: LeagueTier;
    division: number;
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
    /** Non nul une fois la partie terminée : variation de Rating/palier de chaque joueur. */
    ratingChanges: OneWinnerRatingChange[] | null;
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

/**
 * "UN SEUL GAGNANT" est jouable sans compte : un joueur connecté envoie un jeton Clerk, un invité
 * envoie l'identité locale persistée par services/guestIdentity.ts — voir joute-api/src/lib/playerAuth.ts
 * côté serveur pour la résolution correspondante.
 */
export type OneWinnerAuth = {kind: "clerk"; token: string} | {kind: "guest"; guestId: string; displayName: string};

class OneWinnerApiError extends Error {}

function authHeaders(auth: OneWinnerAuth): Record<string, string> {
    // Les en-têtes HTTP ne supportent que l'ASCII : un pseudo accentué ("Espiègle"...) envoyé tel quel
    // est corrompu en transit. On le passe donc en URI-encodé ; le backend le décode symétriquement
    // (voir joute-api/src/lib/playerAuth.ts).
    return auth.kind === "clerk"
        ? {Authorization: `Bearer ${auth.token}`}
        : {"X-Guest-Id": auth.guestId, "X-Guest-Name": encodeURIComponent(auth.displayName)};
}

async function gameFetch<T>(auth: OneWinnerAuth, path: string, options: RequestInit = {}): Promise<T> {
    if (!API_BASE_URL) {
        throw new OneWinnerApiError("EXPO_PUBLIC_API_BASE_URL n'est pas configuré");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {"Content-Type": "application/json", ...authHeaders(auth), ...options.headers},
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new OneWinnerApiError(body?.error ?? `Requête échouée (${response.status})`);
    }
    return body as T;
}

export async function createOneWinnerGame(auth: OneWinnerAuth): Promise<{id: string}> {
    return gameFetch(auth, "/api/games", {method: "POST"});
}

export async function joinOneWinnerGame(auth: OneWinnerAuth, gameId: string): Promise<void> {
    await gameFetch(auth, `/api/games/${gameId}/join`, {method: "POST"});
}

export async function startOneWinnerGame(auth: OneWinnerAuth, gameId: string): Promise<{phase: string}> {
    return gameFetch(auth, `/api/games/${gameId}/start`, {method: "POST"});
}

export async function fetchOneWinnerGame(auth: OneWinnerAuth, gameId: string): Promise<OneWinnerGameSummary> {
    return gameFetch(auth, `/api/games/${gameId}`);
}

export async function fetchOneWinnerAblyToken(auth: OneWinnerAuth, gameId: string): Promise<AblyTokenRequest> {
    return gameFetch(auth, `/api/games/${gameId}/token`);
}

export async function startOneWinnerEpreuve(auth: OneWinnerAuth, gameId: string, questionIds: string[]): Promise<{epreuveId: number; kind: EpreuveKind}> {
    return gameFetch(auth, `/api/games/${gameId}/epreuve`, {method: "POST", body: JSON.stringify({questionIds})});
}

export async function endOneWinnerEpreuve(auth: OneWinnerAuth, gameId: string): Promise<{phase: string}> {
    return gameFetch(auth, `/api/games/${gameId}/end-epreuve`, {method: "POST"});
}

export async function recordOneWinnerBuzz(auth: OneWinnerAuth, gameId: string, questionId: string): Promise<void> {
    await gameFetch(auth, `/api/games/${gameId}/buzz`, {
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

export async function submitOneWinnerAnswer(auth: OneWinnerAuth, gameId: string, input: SubmitOneWinnerAnswerInput): Promise<OneWinnerAnswerSummary> {
    return gameFetch(auth, `/api/games/${gameId}/answer`, {method: "POST", body: JSON.stringify(input)});
}

export async function eliminateOneWinnerStage(auth: OneWinnerAuth, gameId: string): Promise<OneWinnerElimination> {
    return gameFetch(auth, `/api/games/${gameId}/eliminate`, {method: "POST"});
}

export async function advanceOneWinnerStage(
    auth: OneWinnerAuth,
    gameId: string,
): Promise<{phase: string; stageId: OneWinnerStageId; status: string; winnerId: string | null}> {
    return gameFetch(auth, `/api/games/${gameId}/advance`, {method: "POST"});
}

/** Un joueur ne peut reporter que SA PROPRE connexion (l'identité vient de `auth`, jamais du body) —
 * voir POST /api/games/[id]/connection côté backend. */
export async function setOneWinnerConnection(auth: OneWinnerAuth, gameId: string, isConnected: boolean): Promise<void> {
    await gameFetch(auth, `/api/games/${gameId}/connection`, {method: "POST", body: JSON.stringify({isConnected})});
}

export interface OneWinnerMyRating {
    rating: number;
    tier: LeagueTier;
    division: number;
    gamesPlayed: number;
}

/** Palier/Rating du joueur connecté, hors contexte d'une partie précise (ex. modale Profil) — réservé
 * aux comptes (voir game/oneWinnerRankingTypes.ts), jamais appelé pour un invité. */
export async function fetchMyRating(auth: OneWinnerAuth): Promise<OneWinnerMyRating> {
    return gameFetch(auth, "/api/rating");
}

export function buildOneWinnerLink(gameId: string): string {
    return `joute://one-winner/${gameId}`;
}
