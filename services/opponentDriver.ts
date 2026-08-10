import {Category, GhostProfile, Match, QUESTIONS_PER_ROUND, Question} from "@/game/types";
import {chooseCategory, resolveTurn, submitAnswer} from "@/game/engine";
import {drawCategoryOptions, pickQuestions, seededFloat} from "@/game/rules";
import ghosts from "@/data/ghosts";

const GHOST_MIN_DELAY_MS = 2 * 60 * 1000;
const GHOST_MAX_DELAY_MS = 20 * 60 * 1000;
const GHOST_MIN_RESPONSE_MS = 3000;
const GHOST_MAX_RESPONSE_MS = 12000;

export interface OpponentDriver {
    /** Calcule l'instant (epoch ms) où l'adversaire jouera son tour actuel. */
    computeNextTurnAt(match: Match, opponentId: string): number;

    /** Joue entièrement le tour de l'adversaire (rattrapage puis, le cas échéant, choix de thème et réponses) et retourne le match mis à jour. */
    playTurn(match: Match, opponentId: string, pool: readonly Question[], now?: number): Match;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function seedFor(match: Match, opponentId: string, ...parts: (string | number)[]): string {
    return [match.id, opponentId, match.currentRoundIndex, match.updatedAt, ...parts].join(":");
}

function findGhostProfile(opponentId: string): GhostProfile {
    const profile = ghosts.find((ghost) => ghost.id === opponentId);
    if (!profile) {
        throw new Error(`profil fantôme introuvable : ${opponentId}`);
    }
    return profile;
}

function findQuestion(pool: readonly Question[], questionId: string): Question {
    const question = pool.find((candidate) => candidate.id === questionId);
    if (!question) {
        throw new Error(`question introuvable dans le pool fourni : ${questionId}`);
    }
    return question;
}

function toQuestionTriple(ids: readonly string[]): [string, string, string] {
    if (ids.length !== QUESTIONS_PER_ROUND) {
        throw new Error(`il faut exactement ${QUESTIONS_PER_ROUND} questions, reçu ${ids.length}`);
    }
    return [ids[0], ids[1], ids[2]];
}

function pickWrongIndex(correctIndex: number, seed: string): number {
    const wrongIndices = [0, 1, 2, 3].filter((index) => index !== correctIndex);
    const pick = Math.floor(seededFloat(`${seed}:wrong`) * wrongIndices.length);
    return wrongIndices[pick];
}

function decideAnswer(match: Match, profile: GhostProfile, question: Question): {selectedIndex: number; elapsedMs: number} {
    const rate = clamp(profile.baseSuccessRate + (profile.categoryModifiers[question.category] ?? 0), 0, 1);
    const seed = seedFor(match, profile.id, "answer", question.id);
    const isCorrect = seededFloat(`${seed}:outcome`) < rate;
    const selectedIndex = isCorrect ? question.correctIndex : pickWrongIndex(question.correctIndex, seed);
    const elapsedMs = GHOST_MIN_RESPONSE_MS + Math.floor(seededFloat(`${seed}:time`) * (GHOST_MAX_RESPONSE_MS - GHOST_MIN_RESPONSE_MS));
    return {selectedIndex, elapsedMs};
}

function pickGhostCategory(match: Match, profile: GhostProfile): Category {
    const options = drawCategoryOptions(match, 3, seedFor(match, profile.id, "category"));
    return options[0];
}

function answerOpenRound(match: Match, profile: GhostProfile, pool: readonly Question[], now: number): Match {
    const round = match.rounds[match.currentRoundIndex];
    const alreadyAnswered = new Set(
        round.answers.filter((answer) => answer.playerId === profile.id).map((answer) => answer.questionId),
    );

    let next = match;
    for (const questionId of round.questionIds) {
        if (alreadyAnswered.has(questionId)) continue;
        const question = findQuestion(pool, questionId);
        const {selectedIndex, elapsedMs} = decideAnswer(next, profile, question);
        next = submitAnswer({match: next, playerId: profile.id, question, selectedIndex, elapsedMs, now});
    }
    return next;
}

function computeNextTurnAt(match: Match, opponentId: string): number {
    const delaySeed = seedFor(match, opponentId, "delay");
    const delay = GHOST_MIN_DELAY_MS + Math.floor(seededFloat(delaySeed) * (GHOST_MAX_DELAY_MS - GHOST_MIN_DELAY_MS));
    return match.updatedAt + delay;
}

function playTurn(match: Match, opponentId: string, pool: readonly Question[], now: number = Date.now()): Match {
    const profile = findGhostProfile(opponentId);
    let next = match;

    const openRound = next.rounds[next.currentRoundIndex];
    if (openRound && openRound.chosenBy !== opponentId) {
        next = answerOpenRound(next, profile, pool, now);
        next = resolveTurn(next, now);
    }

    if (next.status === "active" && next.rounds.length === next.currentRoundIndex && next.currentTurnPlayerId === opponentId) {
        const category = pickGhostCategory(next, profile);
        const questionIds = toQuestionTriple(
            pickQuestions(pool, category, QUESTIONS_PER_ROUND, [], seedFor(next, opponentId, "questions", category)),
        );
        next = chooseCategory({match: next, playerId: opponentId, category, questionIds, now});
        next = answerOpenRound(next, profile, pool, now);
        next = resolveTurn(next, now);
    }

    return next;
}

export const GhostOpponentDriver: OpponentDriver = {
    computeNextTurnAt,
    playTurn,
};
