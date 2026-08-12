import {Answer, Category, PlateauMatch, PlateauRound, Player, PLATEAU_MAX_PLAYERS, PLATEAU_MIN_PLAYERS, PLATEAU_WINNING_SCORE, Question} from "./types";
import {DRAWABLE_CATEGORIES, EXPIRATION_WINDOW_MS} from "./rules";

export function computePlateauScore(match: PlateauMatch, playerId: string): number {
    return match.rounds
        .flatMap((round) => round.answers)
        .filter((answer) => answer.playerId === playerId && answer.isCorrect)
        .length;
}

export function computePlateauStandings(match: PlateauMatch): {player: Player; score: number}[] {
    return match.players
        .map((player) => ({player, score: computePlateauScore(match, player.id)}))
        .sort((a, b) => b.score - a.score);
}

/** Thèmes encore piochables sur le plateau commun : tous les joueurs partagent le même pool, un thème joué par n'importe qui devient indisponible aux autres — jusqu'à épuisement, où il redevient piochable. */
export function availablePlateauCategories(match: PlateauMatch) {
    const used = new Set(match.rounds.map((round) => round.category));
    const remaining = DRAWABLE_CATEGORIES.filter((category) => !used.has(category));
    return remaining.length > 0 ? remaining : [...DRAWABLE_CATEGORIES];
}

/** Un joueur peut ouvrir une nouvelle manche s'il n'en a pas déjà une en cours (ses 3 questions pas toutes répondues). */
export function canPlayerOpenRound(match: PlateauMatch, playerId: string): boolean {
    if (match.status !== "active") return false;
    const myRounds = match.rounds.filter((round) => round.playerId === playerId);
    const lastRound = myRounds[myRounds.length - 1];
    return !lastRound || lastRound.answers.length >= lastRound.questionIds.length;
}

export interface CreatePlateauMatchInput {
    id: string;
    players: Player[];
    now?: number;
}

export function createPlateauMatch({id, players, now = Date.now()}: CreatePlateauMatchInput): PlateauMatch {
    if (players.length < PLATEAU_MIN_PLAYERS || players.length > PLATEAU_MAX_PLAYERS) {
        throw new Error(`une partie plateau nécessite entre ${PLATEAU_MIN_PLAYERS} et ${PLATEAU_MAX_PLAYERS} joueurs`);
    }
    return {
        id,
        status: "active",
        players,
        rounds: [],
        createdAt: now,
        updatedAt: now,
        expiresAt: now + EXPIRATION_WINDOW_MS,
    };
}

export interface OpenPlateauRoundInput {
    match: PlateauMatch;
    playerId: string;
    category: Category;
    questionIds: [string, string, string];
    now?: number;
}

export function openPlateauRound({match, playerId, category, questionIds, now = Date.now()}: OpenPlateauRoundInput): PlateauMatch {
    if (match.status !== "active") {
        throw new Error("la partie n'est pas active");
    }
    if (!match.players.some((player) => player.id === playerId)) {
        throw new Error("ce joueur ne fait pas partie de la partie");
    }
    if (!canPlayerOpenRound(match, playerId)) {
        throw new Error("ce joueur a déjà une manche en cours");
    }
    if (!availablePlateauCategories(match).includes(category)) {
        throw new Error("ce thème n'est plus disponible");
    }

    const round: PlateauRound = {index: match.rounds.length, playerId, category, questionIds, answers: []};
    return {...match, rounds: [...match.rounds, round], updatedAt: now};
}

export interface SubmitPlateauAnswerInput {
    match: PlateauMatch;
    playerId: string;
    question: Question;
    selectedIndex: number | null;
    elapsedMs: number;
    now?: number;
}

export function submitPlateauAnswer({match, playerId, question, selectedIndex, elapsedMs, now = Date.now()}: SubmitPlateauAnswerInput): PlateauMatch {
    if (match.status !== "active") {
        throw new Error("la partie n'est pas active");
    }

    const roundIndex = match.rounds.findIndex(
        (round) => round.playerId === playerId && round.answers.length < round.questionIds.length,
    );
    if (roundIndex === -1) {
        throw new Error("aucune manche ouverte pour ce joueur");
    }
    const round = match.rounds[roundIndex];
    if (!round.questionIds.includes(question.id)) {
        throw new Error("cette question n'appartient pas à la manche en cours");
    }
    if (round.answers.some((answer) => answer.questionId === question.id)) {
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
    rounds[roundIndex] = {...round, answers: [...round.answers, answer]};
    const updated = {...match, rounds, updatedAt: now};

    if (answer.isCorrect && computePlateauScore(updated, playerId) >= PLATEAU_WINNING_SCORE) {
        return {...updated, status: "completed"};
    }
    return updated;
}
