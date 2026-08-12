export type Category =
    | "histoire"
    | "geographie"
    | "sciences"
    | "nature"
    | "arts"
    | "musique"
    | "cinema"
    | "sport"
    | "societe"
    | "culture-pop"
    | "gastronomie"
    | "langue"
    | "logique"
    | "insolite"
    | "actualite";

export const ALL_CATEGORIES: readonly Category[] = [
    "histoire",
    "geographie",
    "sciences",
    "nature",
    "arts",
    "musique",
    "cinema",
    "sport",
    "societe",
    "culture-pop",
    "gastronomie",
    "langue",
    "logique",
    "insolite",
    "actualite",
];

export type MatchStatus = "pending" | "active" | "completed" | "expired";

/** Nombre de bonnes réponses à atteindre pour remporter une joute Face-à-face (course à 9 points, sans nombre de manches fixe). */
export const WINNING_SCORE = 9;
export const QUESTIONS_PER_ROUND = 3;

export interface Player {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isGhost: boolean;
}

export interface Answer {
    questionId: string;
    playerId: string;
    selectedIndex: number | null;
    isCorrect: boolean;
    elapsedMs: number;
    answeredAt: number;
}

export interface Round {
    index: number;
    category: Category;
    chosenBy: string;
    questionIds: [string, string, string];
    answers: Answer[];
}

export interface Match {
    id: string;
    status: MatchStatus;
    players: [Player, Player];
    rounds: Round[];
    currentRoundIndex: number;
    currentTurnPlayerId: string;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
    invitationCode: string | null;
}

export interface Question {
    id: string;
    category: Category;
    difficulty: 1 | 2 | 3;
    statement: string;
    choices: [string, string, string, string];
    correctIndex: number;
    explanation: string;
    source?: string;
    perishable: boolean;
    validUntil?: string;
}

/** Nombre de bonnes réponses à atteindre pour remporter une partie Plateau (course collective, 4 à 6 joueurs). */
export const PLATEAU_WINNING_SCORE = 24;
export const PLATEAU_MIN_PLAYERS = 4;
export const PLATEAU_MAX_PLAYERS = 6;

export interface PlateauRound {
    index: number;
    playerId: string;
    category: Category;
    questionIds: [string, string, string];
    answers: Answer[];
    openedAt: number;
}

/**
 * Partie à 4-6 joueurs sur une piste commune : contrairement au duel, les joueurs ne jouent pas chacun
 * leur tour dans un ordre imposé — chacun ouvre et joue sa manche à son propre rythme, dès qu'il n'en a
 * pas déjà une en cours. Les thèmes sont piochés dans un pool commun à toute la partie (le plateau).
 */
export interface PlateauMatch {
    id: string;
    status: MatchStatus;
    players: Player[];
    rounds: PlateauRound[];
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
}

export type GhostLevel = "débutant" | "intermédiaire" | "expert";

export interface GhostProfile {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    level: GhostLevel;
    /** Taux de réussite moyen, tous thèmes confondus (0,45 à 0,80). */
    baseSuccessRate: number;
    /** Ajouté à baseSuccessRate pour les thèmes où le fantôme est fort ou faible, clampé à [0, 1]. */
    categoryModifiers: Partial<Record<Category, number>>;
}
