import {
    CHARGE_BASE_POINTS,
    CHARGE_PLAYERS_KEPT_AFTER,
    JOUTE_FILET_THRESHOLD,
    JOUTE_MAX_QUESTIONS,
    JOUTE_QUESTION_TIME_MS,
    JOUTE_WIN_SCORE,
    JOUTE_WRONG_LOCKOUT_MS,
    MELEE_PLAYERS_KEPT_AFTER,
    MELEE_TIME_LIMIT_MS,
    RECONNECT_GRACE_MS,
    chargeMultiplierForStreak,
    jouteValueForElapsed,
    meleeSpeedPoints,
} from "./oneWinnerConfig";
import {
    EliminationResult,
    ONE_WINNER_PLAYERS,
    ONE_WINNER_ROUND_ORDER,
    OneWinnerAnswer,
    OneWinnerMatch,
    OneWinnerPlayerState,
    OneWinnerRoundId,
    OneWinnerRoundState,
    OneWinnerStanding,
} from "./oneWinnerTypes";
import {isAnswerCorrect} from "./textMatch";
import {OpenQuestion, Player, Question, RiddleQuestion} from "./types";

export interface CreateOneWinnerMatchInput {
    id: string;
    players: Player[];
    now?: number;
}

export function createOneWinnerMatch({id, players, now = Date.now()}: CreateOneWinnerMatchInput): OneWinnerMatch {
    if (players.length !== ONE_WINNER_PLAYERS) {
        throw new Error(`"UN SEUL GAGNANT" nécessite exactement ${ONE_WINNER_PLAYERS} joueurs`);
    }
    return {
        id,
        status: "active",
        phase: "lobby",
        roundId: "melee",
        players: players.map((player) => ({
            player,
            isEliminated: false,
            eliminatedAtRound: null,
            finalRank: null,
            isConnected: true,
            disconnectedAt: null,
            chargeTheme: null,
        })),
        rounds: [],
        eliminations: [],
        category: null,
        winnerId: null,
        createdAt: now,
        updatedAt: now,
    };
}

export function startMatch(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "lobby") {
        throw new Error("la partie a déjà démarré");
    }
    return {...match, phase: "intro", updatedAt: now};
}

function activePlayers(match: OneWinnerMatch): OneWinnerPlayerState[] {
    return match.players.filter((entry) => !entry.isEliminated);
}

/** La manche en cours, à condition qu'elle corresponde bien à `match.roundId` et ne soit pas déjà terminée. */
function currentRound(match: OneWinnerMatch): OneWinnerRoundState {
    const round = match.rounds[match.rounds.length - 1];
    if (!round || round.id !== match.roundId || round.endedAt !== null) {
        throw new Error("aucune manche en cours");
    }
    return round;
}

function replaceRound(match: OneWinnerMatch, roundId: OneWinnerRoundId, updater: (round: OneWinnerRoundState) => OneWinnerRoundState): OneWinnerMatch {
    const rounds = match.rounds.map((round) => (round.id === roundId && round.endedAt === null ? updater(round) : round));
    return {...match, rounds};
}

function totalElapsedMs(round: OneWinnerRoundState, playerId: string): number {
    return round.answers.filter((answer) => answer.playerId === playerId).reduce((sum, answer) => sum + answer.elapsedMs, 0);
}

function wrongCount(round: OneWinnerRoundState, playerId: string): number {
    return round.answers.filter((answer) => answer.playerId === playerId && !answer.isCorrect).length;
}

/** Somme des points gagnés par un joueur sur une manche donnée : le score repart de zéro à chaque manche. */
export function computeOneWinnerScore(match: OneWinnerMatch, playerId: string, roundId: OneWinnerRoundId = match.roundId): number {
    const round = match.rounds.find((entry) => entry.id === roundId);
    if (!round) return 0;
    return round.answers.filter((answer) => answer.playerId === playerId).reduce((sum, answer) => sum + answer.pointsAwarded, 0);
}

/**
 * Classement des joueurs encore en lice sur une manche donnée. Égalité de score départagée selon la
 * manche : Mêlée par le temps de réponse cumulé (le plus rapide devant), Charge par le nombre de
 * mauvaises réponses/passes (le moins fautif devant) puis, à égalité encore, par la vitesse cumulée. La
 * Joute n'élimine jamais via ce classement (voir submitJouteAnswer/finishJouteByTiebreak) mais peut s'en
 * servir pour un affichage.
 */
export function computeOneWinnerStandings(match: OneWinnerMatch, roundId: OneWinnerRoundId = match.roundId): OneWinnerStanding[] {
    const round = match.rounds.find((entry) => entry.id === roundId);
    const tiebreak = (a: string, b: string): number => {
        if (!round) return 0;
        if (roundId === "melee") return totalElapsedMs(round, a) - totalElapsedMs(round, b);
        if (roundId === "charge") return wrongCount(round, a) - wrongCount(round, b) || totalElapsedMs(round, a) - totalElapsedMs(round, b);
        return 0;
    };

    return activePlayers(match)
        .map((entry) => ({playerId: entry.player.id, score: computeOneWinnerScore(match, entry.player.id, roundId)}))
        .sort((a, b) => b.score - a.score || tiebreak(a.playerId, b.playerId))
        .map((entry, index) => ({...entry, rank: index + 1}));
}

// ==================================================================================
// La Mêlée — 4 joueurs, QCM partagé, classement par vitesse d'arrivée parmi les corrects
// ==================================================================================

export interface StartMeleeInput {
    match: OneWinnerMatch;
    questionIds: string[];
    now?: number;
}

export function startMelee({match, questionIds, now = Date.now()}: StartMeleeInput): OneWinnerMatch {
    if (match.phase !== "intro" || match.roundId !== "melee") {
        throw new Error("la Mêlée ne peut pas démarrer dans cette phase");
    }
    if (questionIds.length === 0) {
        throw new Error("aucune question fournie pour la Mêlée");
    }
    const round: OneWinnerRoundState = {
        id: "melee",
        questionIds,
        openedQuestions: [{questionId: questionIds[0], openedAt: now}],
        answers: [],
        startedAt: now,
        endedAt: null,
    };
    return {...match, phase: "melee", rounds: [...match.rounds, round], updatedAt: now};
}

function currentOpenQuestionId(round: OneWinnerRoundState): {questionId: string; openedAt: number} | null {
    return round.openedQuestions[round.openedQuestions.length - 1] ?? null;
}

export interface SubmitMeleeAnswerInput {
    match: OneWinnerMatch;
    playerId: string;
    question: Question;
    selectedIndex: number | null;
    elapsedMs: number;
    now?: number;
}

/**
 * Une réponse correcte marque les points du rang d'arrivée parmi les réponses CORRECTES à cette
 * question (1ʳᵉ = 100, 2ᵉ = 70, 3ᵉ = 40, 4ᵉ = 20) — l'ordre est celui d'insertion de cette fonction,
 * jamais un temps fourni par le client. Une réponse fausse ou absente ne rapporte rien.
 */
export function submitMeleeAnswer({match, playerId, question, selectedIndex, elapsedMs, now = Date.now()}: SubmitMeleeAnswerInput): OneWinnerMatch {
    const round = currentRound(match);
    if (round.id !== "melee") throw new Error("ce n'est pas la manche de la Mêlée");
    const current = currentOpenQuestionId(round);
    if (!current || current.questionId !== question.id) {
        throw new Error("ce n'est pas la question en cours");
    }
    if (!activePlayers(match).some((entry) => entry.player.id === playerId)) {
        throw new Error("un joueur éliminé ne peut pas répondre");
    }
    if (round.answers.some((answer) => answer.playerId === playerId && answer.questionId === question.id)) {
        throw new Error("ce joueur a déjà répondu à cette question");
    }

    const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;
    const priorCorrectCount = round.answers.filter((answer) => answer.questionId === question.id && answer.isCorrect).length;
    const pointsAwarded = isCorrect ? meleeSpeedPoints(priorCorrectCount) : 0;

    const answer: OneWinnerAnswer = {
        questionId: question.id,
        playerId,
        selectedIndex,
        submittedText: null,
        isCorrect,
        pointsAwarded,
        usedFilet: false,
        elapsedMs,
        answeredAtServerMs: now,
    };
    return replaceRound(match, "melee", (r) => ({...r, answers: [...r.answers, answer]}));
}

/**
 * Passe à la question suivante de la Mêlée, ou termine la manche si la question courante n'a pas
 * démarré depuis 10 s ou si tous les joueurs actifs y ont répondu — un joueur qui n'a pas répondu à
 * temps ne rapporte simplement aucun point pour cette question, pas besoin d'y insérer une réponse
 * fictive. Termine la manche (phase "classement") une fois la dernière question résolue.
 */
export function advanceMeleeQuestion(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    const round = currentRound(match);
    if (round.id !== "melee") throw new Error("ce n'est pas la manche de la Mêlée");
    const current = currentOpenQuestionId(round);
    if (!current) throw new Error("aucune question en cours");

    const activeIds = activePlayers(match).map((entry) => entry.player.id);
    const answeredIds = new Set(round.answers.filter((answer) => answer.questionId === current.questionId).map((answer) => answer.playerId));
    const allAnswered = activeIds.every((id) => answeredIds.has(id));
    const timedOut = now - current.openedAt >= MELEE_TIME_LIMIT_MS;
    if (!allAnswered && !timedOut) {
        throw new Error("la question en cours n'est pas terminée");
    }

    const openedIds = new Set(round.openedQuestions.map((entry) => entry.questionId));
    const nextQuestionId = round.questionIds.find((id) => !openedIds.has(id));

    if (nextQuestionId) {
        return replaceRound(match, "melee", (r) => ({...r, openedQuestions: [...r.openedQuestions, {questionId: nextQuestionId, openedAt: now}]}));
    }
    const rounds = match.rounds.map((r) => (r.id === "melee" ? {...r, endedAt: now} : r));
    return {...match, rounds, phase: "classement", updatedAt: now};
}

// ==================================================================================
// La Charge — 3 joueurs, thème au choix, réponses libres en parallèle, multiplicateur de série
// ==================================================================================

export function startChargeThemeSelection(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "intro" || match.roundId !== "charge") {
        throw new Error("le choix de thème de la Charge ne peut pas démarrer dans cette phase");
    }
    return {...match, phase: "charge-theme", updatedAt: now};
}

export function chooseChargeTheme(match: OneWinnerMatch, playerId: string, theme: string, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "charge-theme") {
        throw new Error("aucun choix de thème en cours");
    }
    if (!activePlayers(match).some((entry) => entry.player.id === playerId)) {
        throw new Error("un joueur éliminé ne peut pas choisir de thème");
    }
    const players = match.players.map((entry) => (entry.player.id === playerId ? {...entry, chargeTheme: theme} : entry));
    return {...match, players, updatedAt: now};
}

/** Démarre les 60 secondes de la Charge — tous les joueurs actifs doivent avoir choisi leur thème. */
export function startCharge(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "charge-theme") {
        throw new Error("le choix de thème n'est pas terminé");
    }
    if (activePlayers(match).some((entry) => entry.chargeTheme === null)) {
        throw new Error("tous les joueurs n'ont pas encore choisi de thème");
    }
    const round: OneWinnerRoundState = {id: "charge", questionIds: [], openedQuestions: [], answers: [], startedAt: now, endedAt: null};
    return {...match, phase: "charge", rounds: [...match.rounds, round], updatedAt: now};
}

/** Série de bonnes réponses consécutives de ce joueur dans la manche, AVANT la réponse en cours de soumission. */
function currentChargeStreak(round: OneWinnerRoundState, playerId: string): number {
    const mine = round.answers.filter((answer) => answer.playerId === playerId);
    let streak = 0;
    for (let i = mine.length - 1; i >= 0; i--) {
        if (!mine[i].isCorrect) break;
        streak++;
    }
    return streak;
}

export interface SubmitChargeAnswerInput {
    match: OneWinnerMatch;
    playerId: string;
    question: OpenQuestion;
    submittedText: string;
    elapsedMs: number;
    now?: number;
}

/**
 * Chaque bonne réponse rapporte 50 points multipliés par le multiplicateur de série en cours ; une
 * erreur ne fait perdre aucun point mais ramène la série (donc le multiplicateur) à zéro. La Question
 * (et sa réponse attendue) est toujours fournie par l'appelant, jamais choisie par le moteur — voir
 * game/oneWinnerQuestionPicker.ts pour la résolution de "quelle est la prochaine question de CE joueur".
 */
export function submitChargeAnswer({match, playerId, question, submittedText, elapsedMs, now = Date.now()}: SubmitChargeAnswerInput): OneWinnerMatch {
    const round = currentRound(match);
    if (round.id !== "charge") throw new Error("ce n'est pas la manche de la Charge");
    const player = match.players.find((entry) => entry.player.id === playerId);
    if (!player || player.isEliminated) throw new Error("un joueur éliminé ne peut pas répondre");
    if (!player.chargeTheme) throw new Error("ce joueur n'a pas choisi de thème");
    if (round.answers.some((answer) => answer.playerId === playerId && answer.questionId === question.id)) {
        throw new Error("ce joueur a déjà répondu à cette question");
    }

    const isCorrect = isAnswerCorrect(submittedText, question.answer) || (question.acceptableAnswers ?? []).some((alt) => isAnswerCorrect(submittedText, alt));
    const multiplier = chargeMultiplierForStreak(currentChargeStreak(round, playerId));
    const pointsAwarded = isCorrect ? Math.round(CHARGE_BASE_POINTS * multiplier) : 0;

    const answer: OneWinnerAnswer = {
        questionId: question.id,
        playerId,
        selectedIndex: null,
        submittedText,
        isCorrect,
        pointsAwarded,
        usedFilet: false,
        elapsedMs,
        answeredAtServerMs: now,
    };
    return replaceRound(match, "charge", (r) => ({...r, answers: [...r.answers, answer]}));
}

/** Passer une question de la Charge : mêmes effets qu'une erreur (série remise à zéro, aucune perte). */
export function passCharge(match: OneWinnerMatch, playerId: string, question: OpenQuestion, now: number = Date.now()): OneWinnerMatch {
    const round = currentRound(match);
    if (round.id !== "charge") throw new Error("ce n'est pas la manche de la Charge");
    const player = match.players.find((entry) => entry.player.id === playerId);
    if (!player || player.isEliminated) throw new Error("un joueur éliminé ne peut pas passer");
    if (round.answers.some((answer) => answer.playerId === playerId && answer.questionId === question.id)) {
        throw new Error("ce joueur a déjà répondu à cette question");
    }

    const answer: OneWinnerAnswer = {
        questionId: question.id,
        playerId,
        selectedIndex: null,
        submittedText: null,
        isCorrect: false,
        pointsAwarded: 0,
        usedFilet: false,
        elapsedMs: 0,
        answeredAtServerMs: now,
    };
    return replaceRound(match, "charge", (r) => ({...r, answers: [...r.answers, answer]}));
}

export function endCharge(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    const round = currentRound(match);
    if (round.id !== "charge") throw new Error("ce n'est pas la manche de la Charge");
    const rounds = match.rounds.map((r) => (r.id === "charge" ? {...r, endedAt: now} : r));
    return {...match, rounds, phase: "classement", updatedAt: now};
}

// ==================================================================================
// Élimination / progression entre manches — commune à la Mêlée et la Charge (pas la Joute, voir plus bas)
// ==================================================================================

/** Calcule le classement de la manche et élimine les joueurs hors de la limite de la manche (Mêlée 4→3, Charge 3→2). */
export function eliminateAfterRound(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "classement") {
        throw new Error("le classement de la manche n'est pas encore établi");
    }
    const roundId = match.roundId;
    const playersKeptAfter = roundId === "melee" ? MELEE_PLAYERS_KEPT_AFTER : CHARGE_PLAYERS_KEPT_AFTER;

    const standings = computeOneWinnerStandings(match, roundId);
    const eliminatedPlayerIds = standings.slice(playersKeptAfter).map((entry) => entry.playerId);
    const eliminatedSet = new Set(eliminatedPlayerIds);
    const totalRemainingBefore = activePlayers(match).length;

    const players = match.players.map((entry) => {
        if (!eliminatedSet.has(entry.player.id)) return entry;
        const rankFromBottom = totalRemainingBefore - eliminatedPlayerIds.indexOf(entry.player.id);
        return {...entry, isEliminated: true, eliminatedAtRound: roundId, finalRank: rankFromBottom};
    });

    const result: EliminationResult = {roundId, standings, eliminatedPlayerIds, decidedAt: now};
    return {...match, players, eliminations: [...match.eliminations, result], phase: "elimination", updatedAt: now};
}

/** Passe à la manche suivante (Mêlée → Charge → Joute). */
export function advanceToNextRound(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "elimination") {
        throw new Error("l'élimination de cette manche n'a pas encore eu lieu");
    }
    const next = ONE_WINNER_ROUND_ORDER[ONE_WINNER_ROUND_ORDER.indexOf(match.roundId) + 1];
    if (!next) throw new Error("aucune manche suivante");
    return {...match, roundId: next, phase: "intro", updatedAt: now};
}

// ==================================================================================
// La Joute — finale à 2, énigme à révélation progressive, valeur qui décroît, filet QCM en secours
// ==================================================================================

export interface StartJouteInput {
    match: OneWinnerMatch;
    questionIds: string[];
    now?: number;
}

export function startJoute({match, questionIds, now = Date.now()}: StartJouteInput): OneWinnerMatch {
    if (match.phase !== "intro" || match.roundId !== "joute") {
        throw new Error("la Joute ne peut pas démarrer dans cette phase");
    }
    if (questionIds.length === 0) {
        throw new Error("aucune énigme fournie pour la Joute");
    }
    const round: OneWinnerRoundState = {
        id: "joute",
        questionIds,
        openedQuestions: [{questionId: questionIds[0], openedAt: now}],
        answers: [],
        startedAt: now,
        endedAt: null,
    };
    return {...match, phase: "joute", rounds: [...match.rounds, round], updatedAt: now};
}

function assertJouteQuestionOpen(match: OneWinnerMatch, riddleId: string): {round: OneWinnerRoundState; current: {questionId: string; openedAt: number}} {
    const round = currentRound(match);
    if (round.id !== "joute") throw new Error("ce n'est pas la manche de la Joute");
    const current = currentOpenQuestionId(round);
    if (!current || current.questionId !== riddleId) {
        throw new Error("ce n'est pas l'énigme en cours");
    }
    return {round, current};
}

export interface SubmitJouteAnswerInput {
    match: OneWinnerMatch;
    playerId: string;
    riddle: RiddleQuestion;
    submittedText: string;
    now?: number;
}

/**
 * Réponse au clavier, à tout moment pendant que l'énigme est ouverte. Une bonne réponse marque la
 * valeur en cours (calculée ici, côté serveur, à partir de l'horodatage d'ouverture — jamais transmise
 * par le client) et referme l'énigme. Une mauvaise réponse ne fait perdre aucun point mais bloque CE
 * joueur 3 secondes avant de pouvoir retenter (l'autre joueur, lui, peut continuer sans attendre).
 */
export function submitJouteAnswer({match, playerId, riddle, submittedText, now = Date.now()}: SubmitJouteAnswerInput): OneWinnerMatch {
    const {round, current} = assertJouteQuestionOpen(match, riddle.id);
    if (!activePlayers(match).some((entry) => entry.player.id === playerId)) {
        throw new Error("un joueur éliminé ne peut pas répondre");
    }
    const lastWrongKeyboard = [...round.answers]
        .reverse()
        .find((answer) => answer.playerId === playerId && answer.questionId === riddle.id && !answer.isCorrect && !answer.usedFilet);
    if (lastWrongKeyboard && now - lastWrongKeyboard.answeredAtServerMs < JOUTE_WRONG_LOCKOUT_MS) {
        throw new Error("ce joueur est temporairement bloqué après une mauvaise réponse");
    }

    const elapsedMs = now - current.openedAt;
    const isCorrect = isAnswerCorrect(submittedText, riddle.answer);
    const pointsAwarded = isCorrect ? jouteValueForElapsed(elapsedMs) : 0;

    const answer: OneWinnerAnswer = {
        questionId: riddle.id,
        playerId,
        selectedIndex: null,
        submittedText,
        isCorrect,
        pointsAwarded,
        usedFilet: false,
        elapsedMs,
        answeredAtServerMs: now,
    };
    const updated = replaceRound(match, "joute", (r) => ({...r, answers: [...r.answers, answer]}));
    return isCorrect ? resolveJouteQuestionAndAdvance(updated, now) : updated;
}

export interface SubmitJouteFiletAnswerInput {
    match: OneWinnerMatch;
    playerId: string;
    riddle: RiddleQuestion;
    selectedIndex: number;
    now?: number;
}

/**
 * Filet QCM, disponible une fois la valeur de l'énigme descendue à 30 points ou moins. Une bonne
 * réponse marque la moitié de la valeur en cours et referme l'énigme. Une mauvaise réponse ne fait
 * perdre aucun point, mais consomme le filet pour cette énigme (une seule tentative) — le joueur peut
 * encore essayer au clavier ensuite, sans blocage lié au filet.
 */
export function submitJouteFiletAnswer({match, playerId, riddle, selectedIndex, now = Date.now()}: SubmitJouteFiletAnswerInput): OneWinnerMatch {
    const {round, current} = assertJouteQuestionOpen(match, riddle.id);
    if (!activePlayers(match).some((entry) => entry.player.id === playerId)) {
        throw new Error("un joueur éliminé ne peut pas répondre");
    }
    const elapsedMs = now - current.openedAt;
    const value = jouteValueForElapsed(elapsedMs);
    if (value > JOUTE_FILET_THRESHOLD) {
        throw new Error("le filet n'est pas encore disponible sur cette énigme");
    }
    if (round.answers.some((answer) => answer.playerId === playerId && answer.questionId === riddle.id && answer.usedFilet)) {
        throw new Error("le filet a déjà été utilisé sur cette énigme");
    }

    const isCorrect = selectedIndex === riddle.correctIndex;
    const pointsAwarded = isCorrect ? Math.round(value / 2) : 0;

    const answer: OneWinnerAnswer = {
        questionId: riddle.id,
        playerId,
        selectedIndex,
        submittedText: null,
        isCorrect,
        pointsAwarded,
        usedFilet: true,
        elapsedMs,
        answeredAtServerMs: now,
    };
    const updated = replaceRound(match, "joute", (r) => ({...r, answers: [...r.answers, answer]}));
    return isCorrect ? resolveJouteQuestionAndAdvance(updated, now) : updated;
}

/** Force le passage à l'énigme suivante quand personne n'a trouvé dans les 20 secondes imparties. */
export function advanceJouteQuestion(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    const round = currentRound(match);
    if (round.id !== "joute") throw new Error("ce n'est pas la manche de la Joute");
    const current = currentOpenQuestionId(round);
    if (!current) throw new Error("aucune énigme en cours");
    if (now - current.openedAt < JOUTE_QUESTION_TIME_MS) {
        throw new Error("le temps n'est pas encore écoulé sur cette énigme");
    }
    if (round.answers.some((answer) => answer.questionId === current.questionId && answer.isCorrect)) {
        throw new Error("cette énigme est déjà résolue");
    }
    return resolveJouteQuestionAndAdvance(match, now);
}

/**
 * Enchaîne sur l'énigme suivante de la Joute, ou termine la manche/la partie : victoire immédiate dès
 * qu'un joueur dépasse 200 points, sinon départage (score le plus haut, puis le moins d'erreurs, puis le
 * plus rapide au total) une fois les 10 énigmes épuisées.
 */
function resolveJouteQuestionAndAdvance(match: OneWinnerMatch, now: number): OneWinnerMatch {
    const round = currentRound(match);
    const winner = activePlayers(match).find((entry) => computeOneWinnerScore(match, entry.player.id, "joute") > JOUTE_WIN_SCORE);
    if (winner) {
        return finishJoute(match, winner.player.id, now);
    }
    if (round.openedQuestions.length >= JOUTE_MAX_QUESTIONS) {
        return finishJouteByTiebreak(match, now);
    }

    const openedIds = new Set(round.openedQuestions.map((entry) => entry.questionId));
    const nextQuestionId = round.questionIds.find((id) => !openedIds.has(id));
    if (!nextQuestionId) {
        return finishJouteByTiebreak(match, now);
    }
    return replaceRound(match, "joute", (r) => ({...r, openedQuestions: [...r.openedQuestions, {questionId: nextQuestionId, openedAt: now}]}));
}

function finishJoute(match: OneWinnerMatch, winnerId: string, now: number): OneWinnerMatch {
    const rounds = match.rounds.map((r) => (r.id === "joute" ? {...r, endedAt: now} : r));
    const players = match.players.map((entry) => (entry.isEliminated ? entry : {...entry, finalRank: entry.player.id === winnerId ? 1 : 2}));
    return {...match, rounds, players, phase: "termine", status: "completed", winnerId, updatedAt: now};
}

function finishJouteByTiebreak(match: OneWinnerMatch, now: number): OneWinnerMatch {
    const round = currentRound(match);
    const scored = activePlayers(match)
        .map((entry) => ({
            playerId: entry.player.id,
            score: computeOneWinnerScore(match, entry.player.id, "joute"),
            errors: wrongCount(round, entry.player.id),
            speed: totalElapsedMs(round, entry.player.id),
        }))
        .sort((a, b) => b.score - a.score || a.errors - b.errors || a.speed - b.speed);
    return finishJoute(match, scored[0].playerId, now);
}

// ==================================================================================
// Connexion — inchangé quelle que soit la manche
// ==================================================================================

export interface SetPlayerConnectionInput {
    match: OneWinnerMatch;
    playerId: string;
    isConnected: boolean;
    now?: number;
}

export function setPlayerConnection({match, playerId, isConnected, now = Date.now()}: SetPlayerConnectionInput): OneWinnerMatch {
    const players = match.players.map((entry) => {
        if (entry.player.id !== playerId) return entry;
        return {...entry, isConnected, disconnectedAt: isConnected ? null : now};
    });
    return {...match, players, updatedAt: now};
}

/** Élimine par forfait tout joueur déconnecté depuis plus longtemps que la fenêtre de reconnexion. */
export function applyDisconnectForfeits(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    const players = match.players.map((entry) => {
        if (entry.isEliminated || entry.isConnected || entry.disconnectedAt === null) return entry;
        if (now - entry.disconnectedAt < RECONNECT_GRACE_MS) return entry;
        return {...entry, isEliminated: true, eliminatedAtRound: match.roundId};
    });
    return {...match, players, updatedAt: now};
}
