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

/** Un flottant déterministe dans [0, 1) pour une graine donnée, réutilisable partout où il faut du hasard reproductible (ex. simulation du fantôme). */
export function seededFloat(seed: string): number {
    return mulberry32(hashSeed(seed))();
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

export function isQuestionUsable(question: Question, now: number = Date.now()): boolean {
    if (!question.perishable) return true;
    if (!question.validUntil) return false;
    return new Date(question.validUntil).getTime() > now;
}

export function pickQuestions(
    pool: readonly Question[],
    category: Category,
    count: number,
    excludeIds: readonly string[],
    seed: string,
    now: number = Date.now(),
): string[] {
    const excluded = new Set(excludeIds);
    const candidates = pool.filter(
        (question) => question.category === category && !excluded.has(question.id) && isQuestionUsable(question, now),
    );
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

export type MatchOutcome = "win" | "loss" | "draw";

/** Issue d'une partie terminée (completed ou expired) pour un joueur donné, ou null si la partie a été annulée (personne n'a joué). */
export function computeOutcomeForPlayer(match: Match, playerId: string): MatchOutcome | null {
    if (match.status === "completed") {
        const verdict = computeVerdict(match);
        if (verdict === "draw") return "draw";
        const [playerOne] = match.players;
        const playerOneWon = verdict === "playerOneWin";
        const isPlayerOne = playerId === playerOne.id;
        return isPlayerOne === playerOneWon ? "win" : "loss";
    }
    if (match.status === "expired") {
        const outcome = computeExpiredOutcome(match);
        if (outcome.kind === "cancelled") return null;
        return outcome.winnerId === playerId ? "win" : "loss";
    }
    return null;
}

export interface MatchStats {
    wins: number;
    losses: number;
    draws: number;
    /** Nombre de victoires consécutives les plus récentes (0 si la dernière partie terminée n'est pas une victoire). */
    currentStreak: number;
}

export function computeMatchStats(matches: readonly Match[], playerId: string): MatchStats {
    const finished = matches
        .filter((match) => match.status === "completed" || match.status === "expired")
        .filter((match) => match.players.some((player) => player.id === playerId))
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt);

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let currentStreak = 0;
    let streakBroken = false;

    for (const match of finished) {
        const outcome = computeOutcomeForPlayer(match, playerId);
        if (outcome === null) continue;

        if (outcome === "win") wins += 1;
        else if (outcome === "loss") losses += 1;
        else draws += 1;

        if (!streakBroken) {
            if (outcome === "win") currentStreak += 1;
            else streakBroken = true;
        }
    }

    return {wins, losses, draws, currentStreak};
}

export interface PlayerMatchStats {
    /** Thème où le joueur a le plus de bonnes réponses, ou null si aucune manche n'a encore été jouée. */
    bestCategory: Category | null;
    averageResponseMs: number;
    /** Plus longue série de bonnes réponses consécutives, toutes manches confondues, dans l'ordre de jeu. */
    longestCorrectStreak: number;
    /** Nombre de manches où le joueur a eu plus de bonnes réponses que l'adversaire (manches jouées par les deux uniquement). */
    roundsWon: number;
}

export function computePlayerMatchStats(match: Match, playerId: string): PlayerMatchStats {
    const orderedRounds = match.rounds.slice().sort((a, b) => a.index - b.index);

    let bestCategory: Category | null = null;
    let bestCategoryCorrect = -1;
    let roundsWon = 0;
    const orderedAnswers = [];

    for (const round of orderedRounds) {
        const mine = round.answers.filter((answer) => answer.playerId === playerId);
        const theirs = round.answers.filter((answer) => answer.playerId !== playerId);
        const myCorrect = mine.filter((answer) => answer.isCorrect).length;
        const theirCorrect = theirs.filter((answer) => answer.isCorrect).length;

        if (myCorrect > bestCategoryCorrect) {
            bestCategoryCorrect = myCorrect;
            bestCategory = round.category;
        }
        if (mine.length > 0 && theirs.length > 0 && myCorrect > theirCorrect) {
            roundsWon += 1;
        }

        orderedAnswers.push(...mine);
    }

    const averageResponseMs =
        orderedAnswers.length === 0
            ? 0
            : orderedAnswers.reduce((sum, answer) => sum + answer.elapsedMs, 0) / orderedAnswers.length;

    let longestCorrectStreak = 0;
    let currentStreak = 0;
    for (const answer of orderedAnswers) {
        if (answer.isCorrect) {
            currentStreak += 1;
            longestCorrectStreak = Math.max(longestCorrectStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    return {bestCategory, averageResponseMs, longestCorrectStreak, roundsWon};
}
