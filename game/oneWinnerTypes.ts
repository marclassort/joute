import {Category, Player} from "./types";

/** "UN SEUL GAGNANT" : partie à élimination à 4-6 joueurs, en temps réel, jusqu'à un dernier survivant. */
export const ONE_WINNER_MIN_PLAYERS = 4;
export const ONE_WINNER_MAX_PLAYERS = 6;

export type EpreuveKind = "defi" | "buzzer" | "conquete";

/**
 * Une partie traverse plusieurs étapes (main → demi-finale → finale), chacune répétant le même
 * enchaînement de phases. `phase` et `stageId` sont deux axes indépendants de la machine à états :
 * la phase dit quoi faire maintenant, l'étape dit dans quel contexte (qui reste en lice, quelle
 * configuration d'épreuves). Ça évite d'avoir un enum combinatoire du type "finale-epreuve-buzzer".
 */
export type OneWinnerStageId = "main" | "semifinal" | "final";

export type OneWinnerPhase =
    | "lobby"
    | "intro"
    | "epreuve"
    | "classement"
    | "elimination"
    | "termine";

export type OneWinnerMatchStatus = "active" | "completed" | "abandoned";

export interface OneWinnerStageConfig {
    id: OneWinnerStageId;
    epreuves: EpreuveKind[];
    /** Joueurs éliminés à l'issue de cette étape (0 pour la finale : le dernier debout gagne). */
    eliminationCount: number;
}

export interface OneWinnerPlayerState {
    player: Player;
    isEliminated: boolean;
    eliminatedAtStage: OneWinnerStageId | null;
    finalRank: number | null;
    isConnected: boolean;
    /** Horodatage serveur de la dernière déconnexion détectée, null si actuellement connecté. */
    disconnectedAt: number | null;
}

/**
 * Réception d'un buzz côté serveur. `serverReceivedAt` est la SEULE source de vérité pour l'ordre
 * des buzz : le client peut envoyer un timestamp local à titre indicatif, mais il n'est jamais utilisé
 * pour trancher qui a buzzé en premier, afin d'empêcher un client de mentir sur son horodatage.
 */
export interface BuzzEvent {
    playerId: string;
    questionId: string;
    serverReceivedAt: number;
    clientReportedAt: number | null;
}

export interface OneWinnerAnswer {
    questionId: string;
    playerId: string;
    selectedIndex: number | null;
    isCorrect: boolean;
    pointsAwarded: number;
    /** Mise engagée par le joueur avant de répondre (épreuve "La Conquête" uniquement). */
    wager: number | null;
    answeredAtServerMs: number;
}

export interface EpreuveState {
    kind: EpreuveKind;
    stageId: OneWinnerStageId;
    index: number;
    questionIds: string[];
    buzzes: BuzzEvent[];
    answers: OneWinnerAnswer[];
    startedAt: number;
    endedAt: number | null;
}

export interface EliminationResult {
    stageId: OneWinnerStageId;
    standings: {playerId: string; score: number; rank: number}[];
    eliminatedPlayerIds: string[];
    decidedAt: number;
}

export interface OneWinnerMatch {
    id: string;
    status: OneWinnerMatchStatus;
    phase: OneWinnerPhase;
    stageId: OneWinnerStageId;
    players: OneWinnerPlayerState[];
    epreuves: EpreuveState[];
    currentEpreuveIndex: number;
    eliminations: EliminationResult[];
    category: Category | null;
    winnerId: string | null;
    createdAt: number;
    updatedAt: number;
}
