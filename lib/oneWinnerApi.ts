import {OneWinnerPhase, OneWinnerRoundId} from "@/game/oneWinnerTypes";
import {LeagueTier} from "@/game/oneWinnerRankingTypes";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface OneWinnerPlayerSummary {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isEliminated: boolean;
    isConnected: boolean;
    finalRank: number | null;
    chargeTheme: string | null;
}

export interface OneWinnerAnswerSummary {
    playerId: string;
    questionId: string;
    isCorrect: boolean;
    pointsAwarded: number;
    usedFilet: boolean;
    elapsedMs: number;
}

export interface OneWinnerOpenedQuestion {
    questionId: string;
    openedAt: number;
}

export interface OneWinnerRoundSummary {
    id: OneWinnerRoundId;
    questionIds: string[];
    openedQuestions: OneWinnerOpenedQuestion[];
    startedAt: number;
    endedAt: number | null;
    answers: OneWinnerAnswerSummary[];
}

export interface OneWinnerStanding {
    playerId: string;
    score: number;
    rank: number;
}

export interface OneWinnerElimination {
    roundId: OneWinnerRoundId;
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
    roundId: OneWinnerRoundId;
    winnerId: string | null;
    players: OneWinnerPlayerSummary[];
    currentRound: OneWinnerRoundSummary | null;
    liveStandings: OneWinnerStanding[];
    /** Non nul juste après une élimination (fin de la Mêlée ou de la Charge) — pas utilisé pour la Joute, qui termine la partie directement. */
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

export async function createOneWinnerGame(auth: OneWinnerAuth): Promise<{id: string; players: number}> {
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

/** Démarre la manche courante (match.roundId) — questionIds requis pour la Mêlée/la Joute (piochage
 * côté hôte, voir game/oneWinnerQuestionPicker.ts), pas pour la Charge (ouvre juste le choix de thème). */
export async function startOneWinnerRound(auth: OneWinnerAuth, gameId: string, questionIds?: string[]): Promise<{phase: string; roundId: OneWinnerRoundId}> {
    return gameFetch(auth, `/api/games/${gameId}/start-round`, {method: "POST", body: JSON.stringify({questionIds})});
}

/** Fait avancer la partie d'un cran depuis là où elle en est — la transition exacte dépend de la phase courante côté serveur. */
export async function advanceOneWinnerGame(
    auth: OneWinnerAuth,
    gameId: string,
): Promise<{phase: string; roundId: OneWinnerRoundId; status: string; winnerId: string | null}> {
    return gameFetch(auth, `/api/games/${gameId}/advance`, {method: "POST"});
}

export interface SubmitMeleeAnswerInput {
    questionId: string;
    selectedIndex: number | null;
    elapsedMs: number;
}

export async function submitMeleeAnswer(auth: OneWinnerAuth, gameId: string, input: SubmitMeleeAnswerInput): Promise<{isCorrect: boolean; pointsAwarded: number}> {
    return gameFetch(auth, `/api/games/${gameId}/melee/answer`, {method: "POST", body: JSON.stringify(input)});
}

export async function chooseChargeTheme(auth: OneWinnerAuth, gameId: string, theme: string): Promise<void> {
    await gameFetch(auth, `/api/games/${gameId}/charge/theme`, {method: "POST", body: JSON.stringify({theme})});
}

export interface SubmitChargeAnswerInput {
    questionId: string;
    /** null = passer (même effet qu'une erreur : série remise à zéro, aucune perte). */
    submittedText: string | null;
    elapsedMs: number;
}

export async function submitChargeAnswer(
    auth: OneWinnerAuth,
    gameId: string,
    input: SubmitChargeAnswerInput,
): Promise<{isCorrect: boolean; pointsAwarded: number}> {
    return gameFetch(auth, `/api/games/${gameId}/charge/answer`, {method: "POST", body: JSON.stringify(input)});
}

export type SubmitJouteAnswerInput = {riddleId: string; submittedText: string} | {riddleId: string; selectedIndex: number};

export async function submitJouteAnswer(auth: OneWinnerAuth, gameId: string, input: SubmitJouteAnswerInput): Promise<{isCorrect: boolean; pointsAwarded: number}> {
    return gameFetch(auth, `/api/games/${gameId}/joute/answer`, {method: "POST", body: JSON.stringify(input)});
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
