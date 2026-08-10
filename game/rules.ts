import {
    ALL_CATEGORIES,
    Category,
    Match,
    MatchStatus,
    Question,
    ROUNDS_PER_MATCH,
} from "./types";

export const EXPIRATION_WINDOW_MS = 48 * 60 * 60 * 1000;

export const DRAWABLE_CATEGORIES: readonly Category[] = ALL_CATEGORIES.filter(
    (category) => category !== "actualite",
);

export type MatchVerdict = "playerOneWin" | "playerTwoWin" | "draw";

export type ExpiredOutcome =
    | { kind: "cancelled" }
    | { kind: "forfeited"; winnerId: string; loserId: string };

// mulberry32: small deterministic PRNG so the same seed always draws the same
// categories/questions, letting a match be replayed identically from its seed.
function mulberry32(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (Math.imul(31, hash) + seed.charCodeAt(i)) | 0;
    }
    return hash >>> 0;
}

function seededShuffle<T>(items: readonly T[], seed: string): T[] {
    const random = mulberry32(hashSeed(seed));
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

export function otherPlayerId(match: Match, playerId: string): string {
    const [playerOne, playerTwo] = match.players;
    return playerId === playerOne.id ? playerTwo.id : playerOne.id;
}

export function computeScore(match: Match, playerId: string): number {
    return match.rounds
        .flatMap((round) => round.answers)
        .filter((answer) => answer.playerId === playerId && answer.isCorrect)
        .length;
}

export function computeVerdict(match: Match): MatchVerdict {
    const [playerOne, playerTwo] = match.players;
    const scoreOne = computeScore(match, playerOne.id);
    const scoreTwo = computeScore(match, playerTwo.id);
    if (scoreOne === scoreTwo) return "draw";
    return scoreOne > scoreTwo ? "playerOneWin" : "playerTwoWin";
}

export function availableCategories(match: Match): Category[] {
    const used = new Set(match.rounds.map((round) => round.category));
    return DRAWABLE_CATEGORIES.filter((category) => !used.has(category));
}

export function drawCategoryOptions(match: Match, count: number, seed: string): Category[] {
    return seededShuffle(availableCategories(match), seed).slice(0, count);
}

export function pickQuestions(
    pool: readonly Question[],
    category: Category,
    count: number,
    excludeIds: readonly string[],
    seed: string,
): string[] {
    const excluded = new Set(excludeIds);
    const candidates = pool.filter((question) => question.category === category && !excluded.has(question.id));
    return seededShuffle(candidates, seed)
        .slice(0, count)
        .map((question) => question.id);
}

export function isExpired(match: Match, now: number = Date.now()): boolean {
    return now >= match.expiresAt;
}

const OPEN_STATUSES: readonly MatchStatus[] = ["pending", "active"];

export function applyExpiration(match: Match, now: number = Date.now()): Match {
    if (!OPEN_STATUSES.includes(match.status) || !isExpired(match, now)) return match;
    return {...match, status: "expired", updatedAt: now};
}

export function computeExpiredOutcome(match: Match): ExpiredOutcome {
    const hasAnyAnswer = match.rounds.some((round) => round.answers.length > 0);
    if (!hasAnyAnswer) return {kind: "cancelled"};

    const loserId = match.currentTurnPlayerId;
    return {kind: "forfeited", loserId, winnerId: otherPlayerId(match, loserId)};
}

export function isLastRound(roundIndex: number): boolean {
    return roundIndex === ROUNDS_PER_MATCH - 1;
}
