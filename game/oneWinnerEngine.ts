import {
    BUZZER_CORRECT_POINTS,
    BUZZER_LOCKOUT_MS,
    BUZZER_WRONG_PENALTY_POINTS,
    DEFI_WRONG_ANSWER_POINTS,
    RECONNECT_GRACE_MS,
    defiPointsForElapsed,
    nextStageId,
    stageRulesFor,
} from "./oneWinnerConfig";
import {
    BuzzEvent,
    EliminationResult,
    EpreuveKind,
    EpreuveState,
    OneWinnerMatch,
    OneWinnerPlayerState,
    OneWinnerStageId,
    ONE_WINNER_MAX_PLAYERS,
    ONE_WINNER_MIN_PLAYERS,
} from "./oneWinnerTypes";
import {Player, Question} from "./types";

export interface CreateOneWinnerMatchInput {
    id: string;
    players: Player[];
    now?: number;
}

export function createOneWinnerMatch({id, players, now = Date.now()}: CreateOneWinnerMatchInput): OneWinnerMatch {
    if (players.length < ONE_WINNER_MIN_PLAYERS || players.length > ONE_WINNER_MAX_PLAYERS) {
        throw new Error(`"UN SEUL GAGNANT" nécessite entre ${ONE_WINNER_MIN_PLAYERS} et ${ONE_WINNER_MAX_PLAYERS} joueurs`);
    }
    return {
        id,
        status: "active",
        phase: "lobby",
        stageId: "main",
        players: players.map((player) => ({
            player,
            isEliminated: false,
            eliminatedAtStage: null,
            finalRank: null,
            isConnected: true,
            disconnectedAt: null,
        })),
        epreuves: [],
        currentEpreuveIndex: 0,
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

function epreuvesPlayedInStage(match: OneWinnerMatch, stageId: OneWinnerStageId): EpreuveState[] {
    return match.epreuves.filter((epreuve) => epreuve.stageId === stageId);
}

function activePlayers(match: OneWinnerMatch): OneWinnerPlayerState[] {
    return match.players.filter((entry) => !entry.isEliminated);
}

/** Somme des points gagnés par un joueur sur une étape donnée : le score repart de zéro à chaque étape. */
export function computeOneWinnerScore(match: OneWinnerMatch, playerId: string, stageId: OneWinnerStageId = match.stageId): number {
    return match.epreuves
        .filter((epreuve) => epreuve.stageId === stageId)
        .flatMap((epreuve) => epreuve.answers)
        .filter((answer) => answer.playerId === playerId)
        .reduce((sum, answer) => sum + answer.pointsAwarded, 0);
}

export interface OneWinnerStanding {
    playerId: string;
    score: number;
    rank: number;
}

/** Classement des joueurs encore en lice sur l'étape courante, du meilleur score au moins bon. */
export function computeOneWinnerStandings(match: OneWinnerMatch, stageId: OneWinnerStageId = match.stageId): OneWinnerStanding[] {
    return activePlayers(match)
        .map((entry) => ({playerId: entry.player.id, score: computeOneWinnerScore(match, entry.player.id, stageId)}))
        .sort((a, b) => b.score - a.score)
        .map((entry, index) => ({...entry, rank: index + 1}));
}

export interface StartNextEpreuveInput {
    match: OneWinnerMatch;
    questionIds: string[];
    now?: number;
}

/** Lance l'épreuve suivante de l'étape courante (déterminée par la configuration, jamais choisie à la volée). */
export function startNextEpreuve({match, questionIds, now = Date.now()}: StartNextEpreuveInput): OneWinnerMatch {
    if (match.phase !== "intro" && match.phase !== "epreuve") {
        throw new Error("aucune épreuve ne peut démarrer dans cette phase");
    }
    const played = epreuvesPlayedInStage(match, match.stageId);
    if (match.phase === "epreuve" && played[played.length - 1]?.endedAt === null) {
        throw new Error("l'épreuve en cours n'est pas terminée");
    }

    const stageRules = stageRulesFor(match.stageId);
    const kind: EpreuveKind | undefined = stageRules.epreuves[played.length];
    if (!kind) {
        throw new Error("toutes les épreuves de cette étape ont déjà été jouées");
    }

    const epreuve: EpreuveState = {
        kind,
        stageId: match.stageId,
        index: match.epreuves.length,
        questionIds,
        buzzes: [],
        answers: [],
        startedAt: now,
        endedAt: null,
    };

    return {
        ...match,
        phase: "epreuve",
        epreuves: [...match.epreuves, epreuve],
        currentEpreuveIndex: played.length,
        updatedAt: now,
    };
}

function currentEpreuve(match: OneWinnerMatch): EpreuveState {
    const epreuve = match.epreuves[match.epreuves.length - 1];
    if (!epreuve || match.phase !== "epreuve" || epreuve.endedAt !== null) {
        throw new Error("aucune épreuve en cours");
    }
    return epreuve;
}

export interface RecordBuzzInput {
    match: OneWinnerMatch;
    playerId: string;
    questionId: string;
    /** Timestamp local du client, conservé à titre indicatif uniquement — jamais utilisé pour l'ordre. */
    clientReportedAt?: number | null;
    now?: number;
}

/**
 * Enregistre un buzz. L'ordre des buzz sur une question n'est déterminé QUE par l'ordre d'arrivée des
 * appels à cette fonction (donc par `now`, l'horloge serveur) : un client ne peut jamais s'attribuer
 * un rang en mentant sur son propre timestamp.
 */
export function recordBuzz({match, playerId, questionId, clientReportedAt = null, now = Date.now()}: RecordBuzzInput): OneWinnerMatch {
    const epreuve = currentEpreuve(match);
    if (epreuve.kind !== "buzzer") {
        throw new Error("le buzz n'est disponible que pendant l'épreuve du buzzer");
    }
    if (!epreuve.questionIds.includes(questionId)) {
        throw new Error("cette question n'appartient pas à l'épreuve en cours");
    }
    if (match.players.find((entry) => entry.player.id === playerId)?.isEliminated) {
        throw new Error("un joueur éliminé ne peut pas buzzer");
    }

    const sameQuestionBuzzes = epreuve.buzzes.filter((buzz) => buzz.questionId === questionId);
    if (sameQuestionBuzzes.some((buzz) => buzz.playerId === playerId)) {
        throw new Error("ce joueur a déjà buzzé sur cette question");
    }
    const lastWrongByPlayer = [...epreuve.answers]
        .reverse()
        .find((answer) => answer.playerId === playerId && answer.questionId === questionId && !answer.isCorrect);
    if (lastWrongByPlayer && now - lastWrongByPlayer.answeredAtServerMs < BUZZER_LOCKOUT_MS) {
        throw new Error("ce joueur est temporairement bloqué après une mauvaise réponse");
    }

    const buzz: BuzzEvent = {playerId, questionId, serverReceivedAt: now, clientReportedAt};
    const epreuves = [...match.epreuves];
    epreuves[epreuves.length - 1] = {...epreuve, buzzes: [...epreuve.buzzes, buzz]};
    return {...match, epreuves, updatedAt: now};
}

/** Le joueur autorisé à répondre en ce moment sur l'épreuve du buzzer : le premier à avoir buzzé sans encore avoir répondu. */
export function currentBuzzHolder(match: OneWinnerMatch): string | null {
    const epreuve = match.epreuves[match.epreuves.length - 1];
    if (!epreuve || epreuve.kind !== "buzzer") return null;

    const lastQuestionId = epreuve.questionIds.find((questionId) => {
        const answered = epreuve.answers.some((answer) => answer.questionId === questionId && answer.isCorrect);
        const buzzesForQuestion = epreuve.buzzes.filter((buzz) => buzz.questionId === questionId);
        const wrongAnswerers = new Set(
            epreuve.answers.filter((answer) => answer.questionId === questionId && !answer.isCorrect).map((answer) => answer.playerId),
        );
        return !answered && buzzesForQuestion.some((buzz) => !wrongAnswerers.has(buzz.playerId));
    });
    if (!lastQuestionId) return null;

    const wrongAnswerers = new Set(
        epreuve.answers.filter((answer) => answer.questionId === lastQuestionId && !answer.isCorrect).map((answer) => answer.playerId),
    );
    const ordered = epreuve.buzzes
        .filter((buzz) => buzz.questionId === lastQuestionId && !wrongAnswerers.has(buzz.playerId))
        .sort((a, b) => a.serverReceivedAt - b.serverReceivedAt);
    return ordered[0]?.playerId ?? null;
}

export interface SubmitOneWinnerAnswerInput {
    match: OneWinnerMatch;
    playerId: string;
    question: Question;
    selectedIndex: number | null;
    elapsedMs: number;
    wager?: number | null;
    now?: number;
}

export function submitOneWinnerAnswer({
    match,
    playerId,
    question,
    selectedIndex,
    elapsedMs,
    wager = null,
    now = Date.now(),
}: SubmitOneWinnerAnswerInput): OneWinnerMatch {
    const epreuve = currentEpreuve(match);
    if (!epreuve.questionIds.includes(question.id)) {
        throw new Error("cette question n'appartient pas à l'épreuve en cours");
    }

    if (epreuve.kind === "buzzer" && currentBuzzHolder(match) !== playerId) {
        throw new Error("ce joueur n'a pas la main pour répondre");
    }
    if (epreuve.kind === "conquete" && wager === null) {
        throw new Error("une mise est requise pour l'épreuve de la conquête");
    }
    if (epreuve.answers.some((answer) => answer.playerId === playerId && answer.questionId === question.id)) {
        throw new Error("ce joueur a déjà répondu à cette question");
    }

    const isCorrect = selectedIndex !== null && selectedIndex === question.correctIndex;
    const pointsAwarded = computePointsAwarded(epreuve.kind, isCorrect, elapsedMs, wager);

    const answer = {
        questionId: question.id,
        playerId,
        selectedIndex,
        isCorrect,
        pointsAwarded,
        wager: epreuve.kind === "conquete" ? wager : null,
        answeredAtServerMs: now,
    };

    const epreuves = [...match.epreuves];
    epreuves[epreuves.length - 1] = {...epreuve, answers: [...epreuve.answers, answer]};
    return {...match, epreuves, updatedAt: now};
}

function computePointsAwarded(kind: EpreuveKind, isCorrect: boolean, elapsedMs: number, wager: number | null): number {
    if (kind === "defi") {
        return isCorrect ? defiPointsForElapsed(elapsedMs) : DEFI_WRONG_ANSWER_POINTS;
    }
    if (kind === "buzzer") {
        return isCorrect ? BUZZER_CORRECT_POINTS : BUZZER_WRONG_PENALTY_POINTS;
    }
    const stake = wager ?? 0;
    return isCorrect ? stake : -stake;
}

export function endCurrentEpreuve(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    const epreuve = currentEpreuve(match);
    const epreuves = [...match.epreuves];
    epreuves[epreuves.length - 1] = {...epreuve, endedAt: now};

    const stageRules = stageRulesFor(match.stageId);
    const played = epreuvesPlayedInStage({...match, epreuves}, match.stageId);
    const phase = played.length >= stageRules.epreuves.length ? "classement" : "epreuve";

    return {...match, epreuves, phase, updatedAt: now};
}

/** Calcule le classement de l'étape et élimine les joueurs hors de la limite `playersKeptAfter`. */
export function applyElimination(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "classement") {
        throw new Error("le classement de l'étape n'est pas encore établi");
    }

    const stageRules = stageRulesFor(match.stageId);
    const standings = computeOneWinnerStandings(match, match.stageId);
    const eliminatedPlayerIds = standings.slice(stageRules.playersKeptAfter).map((entry) => entry.playerId);

    const eliminatedSet = new Set(eliminatedPlayerIds);
    const totalRemainingBefore = activePlayers(match).length;
    const players = match.players.map((entry) => {
        if (!eliminatedSet.has(entry.player.id)) return entry;
        const rankFromBottom = totalRemainingBefore - eliminatedPlayerIds.indexOf(entry.player.id);
        return {...entry, isEliminated: true, eliminatedAtStage: match.stageId, finalRank: rankFromBottom};
    });

    const result: EliminationResult = {
        stageId: match.stageId,
        standings,
        eliminatedPlayerIds,
        decidedAt: now,
    };

    return {...match, players, eliminations: [...match.eliminations, result], phase: "elimination", updatedAt: now};
}

/** Passe à l'étape suivante (demi-finale, finale) ou termine la partie si plus aucune étape ne suit. */
export function advanceStage(match: OneWinnerMatch, now: number = Date.now()): OneWinnerMatch {
    if (match.phase !== "elimination") {
        throw new Error("l'élimination de cette étape n'a pas encore eu lieu");
    }

    const remaining = activePlayers(match);
    const next = nextStageId(match.stageId);

    if (remaining.length <= 1 || !next) {
        const winner = remaining[0] ?? null;
        const players = match.players.map((entry) =>
            entry.player.id === winner?.player.id ? {...entry, finalRank: 1} : entry,
        );
        return {
            ...match,
            players,
            phase: "termine",
            status: "completed",
            winnerId: winner?.player.id ?? null,
            updatedAt: now,
        };
    }

    return {...match, stageId: next, phase: "intro", currentEpreuveIndex: 0, updatedAt: now};
}

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
        return {...entry, isEliminated: true, eliminatedAtStage: match.stageId};
    });
    return {...match, players, updatedAt: now};
}
