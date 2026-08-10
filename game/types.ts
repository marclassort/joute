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

export const ROUNDS_PER_MATCH = 8;
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
