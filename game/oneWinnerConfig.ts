import {EpreuveKind, OneWinnerStageId} from "./oneWinnerTypes";

/**
 * Configuration centralisée du mode "UN SEUL GAGNANT" : aucune de ces valeurs ne doit être dupliquée
 * en dur ailleurs (moteur, UI, backend) — tout ajustement de game design passe par ce fichier.
 */

export interface OneWinnerStageRules {
    id: OneWinnerStageId;
    epreuves: readonly EpreuveKind[];
    /** Joueurs conservés à l'issue de cette étape (le reste est éliminé selon le classement) — pas un
     * compte fixe d'éliminés, pour rester valide quel que soit l'effectif de départ (4 à 6). */
    playersKeptAfter: number;
}

export const ONE_WINNER_STAGE_RULES: readonly OneWinnerStageRules[] = [
    {id: "main", epreuves: ["defi", "buzzer", "conquete"], playersKeptAfter: 3},
    {id: "semifinal", epreuves: ["buzzer"], playersKeptAfter: 2},
    {id: "final", epreuves: ["buzzer"], playersKeptAfter: 1},
];

export const QUESTIONS_PER_EPREUVE: Readonly<Record<EpreuveKind, number>> = {
    defi: 5,
    buzzer: 8,
    conquete: 3,
};

/** Palier de points selon la vitesse de réponse, du plus rapide au plus lent. */
export interface SpeedTier {
    maxElapsedMs: number;
    points: number;
}

// --- Le Défi : QCM simultané, tout le monde répond, points dégressifs selon la vitesse ---
export const DEFI_TIME_LIMIT_MS = 10_000;
export const DEFI_SPEED_TIERS: readonly SpeedTier[] = [
    {maxElapsedMs: 3_000, points: 100},
    {maxElapsedMs: 6_000, points: 70},
    {maxElapsedMs: 10_000, points: 40},
];
export const DEFI_WRONG_ANSWER_POINTS = 0;

// --- Le Buzzer : premier à buzzer répond seul, mauvaise réponse pénalise et rouvre le buzz ---
export const BUZZER_TIME_LIMIT_MS = 8_000;
export const BUZZER_CORRECT_POINTS = 100;
export const BUZZER_WRONG_PENALTY_POINTS = -50;
/** Ce joueur ne peut pas rebuzzer sur la même question pendant ce délai après une mauvaise réponse. */
export const BUZZER_LOCKOUT_MS = 2_000;

// --- La Conquête : risque/récompense, le joueur mise une partie de son score avant de répondre ---
export const CONQUETE_MIN_WAGER_RATIO = 0.1;
export const CONQUETE_MAX_WAGER_RATIO = 1;
export const CONQUETE_TIME_LIMIT_MS = 15_000;

/** Fenêtre pendant laquelle un joueur déconnecté peut revenir sans être traité comme éliminé/forfait. */
export const RECONNECT_GRACE_MS = 30_000;

export function stageRulesFor(stageId: OneWinnerStageId): OneWinnerStageRules {
    const rules = ONE_WINNER_STAGE_RULES.find((stage) => stage.id === stageId);
    if (!rules) throw new Error(`configuration manquante pour l'étape ${stageId}`);
    return rules;
}

export function nextStageId(stageId: OneWinnerStageId): OneWinnerStageId | null {
    const index = ONE_WINNER_STAGE_RULES.findIndex((stage) => stage.id === stageId);
    const next = ONE_WINNER_STAGE_RULES[index + 1];
    return next ? next.id : null;
}

/** Point de score attribué pour une réponse au Défi selon son délai, ou DEFI_WRONG_ANSWER_POINTS si incorrecte. */
export function defiPointsForElapsed(elapsedMs: number): number {
    const tier = DEFI_SPEED_TIERS.find((candidate) => elapsedMs <= candidate.maxElapsedMs);
    return tier ? tier.points : 0;
}
