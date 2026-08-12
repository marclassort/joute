import {Answer, Category, Match, MatchStatus, Player, Question, Round, WINNING_SCORE} from "./types";
import {EXPIRATION_WINDOW_MS, availableCategories, computeScore, otherPlayerId} from "./rules";

export interface CreateMatchInput {
    id: string;
    players: [Player, Player];
    invitationCode?: string | null;
    /** "pending" pour une invitation envoyée dont le deuxième joueur n'a pas encore rejoint. */
    status?: MatchStatus;
    now?: number;
}

export function createMatch({id, players, invitationCode = null, status = "active", now = Date.now()}: CreateMatchInput): Match {
    return {
        id,
        status,
        players,
        rounds: [],
        currentRoundIndex: 0,
        currentTurnPlayerId: players[0].id,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + EXPIRATION_WINDOW_MS,
        invitationCode,
    };
}

export interface JoinMatchInput {
    match: Match;
    player: Player;
    now?: number;
}

/** L'invité rejoint une partie "pending" créée via un lien d'invitation : remplace le second joueur (placeholder) et active la partie. */
export function joinMatch({match, player, now = Date.now()}: JoinMatchInput): Match {
    if (match.status !== "pending") {
        throw new Error("cette invitation n'est plus valide");
    }
    if (player.id === match.players[0].id) {
        throw new Error("tu ne peux pas rejoindre ta propre invitation");
    }

    return {
        ...match,
        status: "active",
        players: [match.players[0], player],
        updatedAt: now,
        expiresAt: now + EXPIRATION_WINDOW_MS,
    };
}

export interface ChooseCategoryInput {
    match: Match;
    playerId: string;
    category: Category;
    questionIds: [string, string, string];
    now?: number;
}

export function chooseCategory({match, playerId, category, questionIds, now = Date.now()}: ChooseCategoryInput): Match {
    if (match.status !== "active") {
        throw new Error("la partie n'est pas active");
    }
    if (playerId !== match.currentTurnPlayerId) {
        throw new Error("ce n'est pas ton tour");
    }
    if (match.rounds.length !== match.currentRoundIndex) {
        throw new Error("la manche en cours a déjà un thème");
    }
    if (!availableCategories(match).includes(category)) {
        throw new Error("ce thème n'est plus disponible");
    }

    const round: Round = {
        index: match.currentRoundIndex,
        category,
        chosenBy: playerId,
        questionIds,
        answers: [],
    };

    return {
        ...match,
        rounds: [...match.rounds, round],
        updatedAt: now,
    };
}

export interface SubmitAnswerInput {
    match: Match;
    playerId: string;
    question: Question;
    selectedIndex: number | null;
    elapsedMs: number;
    now?: number;
}

export function submitAnswer({match, playerId, question, selectedIndex, elapsedMs, now = Date.now()}: SubmitAnswerInput): Match {
    if (match.status !== "active") {
        throw new Error("la partie n'est pas active");
    }
    if (playerId !== match.currentTurnPlayerId) {
        throw new Error("ce n'est pas ton tour");
    }

    const round = match.rounds[match.currentRoundIndex];
    if (!round) {
        throw new Error("aucune manche ouverte pour l'instant");
    }
    if (!round.questionIds.includes(question.id)) {
        throw new Error("cette question n'appartient pas à la manche en cours");
    }
    if (round.answers.some((answer) => answer.playerId === playerId && answer.questionId === question.id)) {
        throw new Error("cette question a déjà reçu une réponse");
    }

    const answer: Answer = {
        questionId: question.id,
        playerId,
        selectedIndex,
        isCorrect: selectedIndex !== null && selectedIndex === question.correctIndex,
        elapsedMs,
        answeredAt: now,
    };

    const rounds = [...match.rounds];
    rounds[match.currentRoundIndex] = {...round, answers: [...round.answers, answer]};

    const updated = {...match, rounds, updatedAt: now};

    // Course à WINNING_SCORE : la joute s'arrête dès qu'un joueur l'atteint, même en cours de manche.
    if (answer.isCorrect && computeScore(updated, playerId) >= WINNING_SCORE) {
        return {...updated, status: "completed"};
    }

    return updated;
}

export function resolveTurn(match: Match, now: number = Date.now()): Match {
    if (match.status !== "active") return match;

    const round = match.rounds[match.currentRoundIndex];
    if (!round) return match;

    const actingPlayerAnswers = round.answers.filter((answer) => answer.playerId === match.currentTurnPlayerId).length;
    if (actingPlayerAnswers < round.questionIds.length) return match;

    const roundFullyAnswered = round.answers.length >= round.questionIds.length * 2;

    if (roundFullyAnswered) {
        return {...match, currentRoundIndex: match.currentRoundIndex + 1, updatedAt: now};
    }

    return {
        ...match,
        currentTurnPlayerId: otherPlayerId(match, match.currentTurnPlayerId),
        updatedAt: now,
        expiresAt: now + EXPIRATION_WINDOW_MS,
    };
}
