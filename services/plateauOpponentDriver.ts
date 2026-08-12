import {GhostProfile, PlateauMatch, QUESTIONS_PER_ROUND, Question} from "@/game/types";
import {availablePlateauCategories, canPlayerOpenRound, openPlateauRound, submitPlateauAnswer} from "@/game/plateauEngine";
import {pickQuestions, seededFloat} from "@/game/rules";
import ghosts from "@/data/ghosts";

const GHOST_MIN_DELAY_MS = 2 * 60 * 1000;
const GHOST_MAX_DELAY_MS = 20 * 60 * 1000;
const GHOST_MIN_RESPONSE_MS = 3000;
const GHOST_MAX_RESPONSE_MS = 12000;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function seedFor(match: PlateauMatch, ghostId: string, ...parts: (string | number)[]): string {
    return [match.id, ghostId, ...parts].join(":");
}

function findGhostProfile(ghostId: string): GhostProfile {
    const profile = ghosts.find((ghost) => ghost.id === ghostId);
    if (!profile) {
        throw new Error(`profil fantôme introuvable : ${ghostId}`);
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

function pickWrongIndex(correctIndex: number, seed: string): number {
    const wrongIndices = [0, 1, 2, 3].filter((index) => index !== correctIndex);
    const pick = Math.floor(seededFloat(`${seed}:wrong`) * wrongIndices.length);
    return wrongIndices[pick];
}

function decideAnswer(profile: GhostProfile, question: Question, seed: string): {selectedIndex: number; elapsedMs: number} {
    const rate = clamp(profile.baseSuccessRate + (profile.categoryModifiers[question.category] ?? 0), 0, 1);
    const isCorrect = seededFloat(`${seed}:outcome`) < rate;
    const selectedIndex = isCorrect ? question.correctIndex : pickWrongIndex(question.correctIndex, seed);
    const elapsedMs = GHOST_MIN_RESPONSE_MS + Math.floor(seededFloat(`${seed}:time`) * (GHOST_MAX_RESPONSE_MS - GHOST_MIN_RESPONSE_MS));
    return {selectedIndex, elapsedMs};
}

/** Instant (epoch ms) où ce fantôme ouvrira sa prochaine manche, calculé depuis la fin de sa dernière manche (ou la création de la partie s'il n'a encore rien joué). */
export function computeNextRoundAt(match: PlateauMatch, ghostId: string): number {
    const myRounds = match.rounds.filter((round) => round.playerId === ghostId);
    const lastRound = myRounds[myRounds.length - 1];
    const lastAnswer = lastRound?.answers[lastRound.answers.length - 1];
    const baseAt = lastAnswer?.answeredAt ?? match.createdAt;

    const seed = seedFor(match, ghostId, "delay", myRounds.length);
    const delay = GHOST_MIN_DELAY_MS + Math.floor(seededFloat(seed) * (GHOST_MAX_DELAY_MS - GHOST_MIN_DELAY_MS));
    return baseAt + delay;
}

function finishOpenRound(match: PlateauMatch, profile: GhostProfile, pool: readonly Question[], now: number): PlateauMatch {
    let next = match;
    for (;;) {
        if (next.status !== "active") break;
        const round = next.rounds.find((r) => r.playerId === profile.id && r.answers.length < r.questionIds.length);
        if (!round) break;
        const nextQuestionId = round.questionIds.find((id) => !round.answers.some((answer) => answer.questionId === id));
        if (!nextQuestionId) break;

        const question = findQuestion(pool, nextQuestionId);
        const seed = seedFor(next, profile.id, "answer", nextQuestionId);
        const {selectedIndex, elapsedMs} = decideAnswer(profile, question, seed);
        next = submitPlateauAnswer({match: next, playerId: profile.id, question, selectedIndex, elapsedMs, now});
    }
    return next;
}

function openAndPlayRound(match: PlateauMatch, profile: GhostProfile, pool: readonly Question[], now: number): PlateauMatch {
    const myRoundCount = match.rounds.filter((round) => round.playerId === profile.id).length;
    const options = availablePlateauCategories(match);
    const categorySeed = seedFor(match, profile.id, "category", myRoundCount);
    const category = options[Math.floor(seededFloat(categorySeed) * options.length)];
    const questionIds = pickQuestions(
        pool,
        category,
        QUESTIONS_PER_ROUND,
        [],
        seedFor(match, profile.id, "questions", myRoundCount, category),
    ) as [string, string, string];

    const opened = openPlateauRound({match, playerId: profile.id, category, questionIds, now});
    return finishOpenRound(opened, profile, pool, now);
}

/** Fait avancer chaque joueur fantôme du plateau qui a une manche à finir ou dont c'est l'heure d'en ouvrir une nouvelle. S'arrête dès que la partie se termine (un joueur — humain ou fantôme — a atteint le score gagnant). */
export function playAvailableGhostTurns(match: PlateauMatch, pool: readonly Question[], now: number = Date.now()): PlateauMatch {
    let next = match;

    for (const player of match.players.filter((candidate) => candidate.isGhost)) {
        if (next.status !== "active") break;

        const profile = findGhostProfile(player.id);
        if (!canPlayerOpenRound(next, player.id)) {
            next = finishOpenRound(next, profile, pool, now);
            continue;
        }
        if (now >= computeNextRoundAt(next, player.id)) {
            next = openAndPlayRound(next, profile, pool, now);
        }
    }

    return next;
}
