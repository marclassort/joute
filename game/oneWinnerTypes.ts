import {Category, Player} from "./types";

/** "UN SEUL GAGNANT" : 4 joueurs, en temps réel, 3 manches fixes (Mêlée → Charge → Joute), une élimination à la fin de chacune des deux premières. */
export const ONE_WINNER_PLAYERS = 4;

export type OneWinnerRoundId = "melee" | "charge" | "joute";

export const ONE_WINNER_ROUND_ORDER: readonly OneWinnerRoundId[] = ["melee", "charge", "joute"];

export type OneWinnerPhase =
    | "lobby"
    | "intro"
    | "melee"
    | "charge-theme"
    | "charge"
    | "joute"
    | "classement"
    | "elimination"
    | "termine";

export type OneWinnerMatchStatus = "active" | "completed" | "abandoned";

export interface OneWinnerPlayerState {
    player: Player;
    isEliminated: boolean;
    eliminatedAtRound: OneWinnerRoundId | null;
    finalRank: number | null;
    isConnected: boolean;
    disconnectedAt: number | null;
    /** Thème choisi pour La Charge, posé une fois au début de la manche — null tant que non choisi. */
    chargeTheme: string | null;
}

/**
 * Une réponse porte soit un index QCM (Mêlée, filet de la Joute), soit un texte libre (Charge, Joute au
 * clavier) — jamais les deux. Contrairement aux autres manches, la Joute autorise PLUSIEURS réponses du
 * même joueur à la même question (tant qu'elle reste ouverte) : chaque tentative ratée est conservée
 * (blocage de 3 s, pas de perte), donc pas de contrainte d'unicité (playerId, questionId) ici.
 */
export interface OneWinnerAnswer {
    questionId: string;
    playerId: string;
    selectedIndex: number | null;
    submittedText: string | null;
    isCorrect: boolean;
    pointsAwarded: number;
    /** Vrai uniquement pour une réponse donnée via le filet QCM de la Joute. */
    usedFilet: boolean;
    elapsedMs: number;
    answeredAtServerMs: number;
}

export interface OpenedRoundQuestion {
    questionId: string;
    /** Horodatage serveur d'ouverture — seule référence pour tout calcul dépendant du temps (avancée
     * forcée de la Mêlée après 10 s, valeur qui décroît en Joute), jamais fourni par le client. */
    openedAt: number;
}

export interface OneWinnerRoundState {
    id: OneWinnerRoundId;
    questionIds: string[];
    /**
     * Questions effectivement ouvertes dans cette manche, dans l'ordre — la dernière est la question
     * courante (Mêlée, Joute : question partagée par tous). Journal en ajout seul plutôt qu'un simple
     * index dérivé des réponses, pour pouvoir avancer de force au bout du temps imparti même si tout le
     * monde n'a pas répondu. Vide pour la Charge, où chaque joueur avance seul dans sa propre séquence.
     */
    openedQuestions: OpenedRoundQuestion[];
    answers: OneWinnerAnswer[];
    startedAt: number;
    endedAt: number | null;
}

export interface OneWinnerStanding {
    playerId: string;
    score: number;
    rank: number;
}

export interface EliminationResult {
    roundId: OneWinnerRoundId;
    standings: OneWinnerStanding[];
    eliminatedPlayerIds: string[];
    decidedAt: number;
}

export interface OneWinnerMatch {
    id: string;
    status: OneWinnerMatchStatus;
    phase: OneWinnerPhase;
    roundId: OneWinnerRoundId;
    players: OneWinnerPlayerState[];
    rounds: OneWinnerRoundState[];
    eliminations: EliminationResult[];
    category: Category | null;
    winnerId: string | null;
    createdAt: number;
    updatedAt: number;
}
