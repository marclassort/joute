/**
 * Configuration centralisée du mode "UN SEUL GAGNANT" : aucune de ces valeurs ne doit être dupliquée
 * en dur ailleurs (moteur, UI, backend) — tout ajustement de game design passe par ce fichier.
 */

// --- La Mêlée : 4 joueurs, QCM simultané, classement par vitesse d'arrivée parmi les bonnes réponses ---
export const MELEE_QUESTION_COUNT = 6;
export const MELEE_TIME_LIMIT_MS = 10_000;
/** Points du 1er au 4e à répondre correctement (ordre d'arrivée, jamais un palier de temps absolu) — une réponse fausse ou absente ne rapporte rien. */
export const MELEE_SPEED_POINTS: readonly number[] = [100, 70, 40, 20];
/** Joueurs conservés après la Mêlée (4 → 3) : le dernier au classement cumulé est éliminé. */
export const MELEE_PLAYERS_KEPT_AFTER = 3;

// --- La Charge : 3 joueurs, thème au choix, réponses libres en parallèle, multiplicateur de série ---
export const CHARGE_THEME_COUNT = 3;
export const CHARGE_TIME_LIMIT_MS = 60_000;
export const CHARGE_BASE_POINTS = 50;
/** Multiplicateur selon la série de bonnes réponses consécutives (indexé par la série, plafonné au dernier). */
export const CHARGE_MULTIPLIERS: readonly number[] = [1, 1.2, 1.4, 1.6, 1.8, 2];
/** Joueurs conservés après la Charge (3 → 2) : le dernier au classement cumulé est éliminé. */
export const CHARGE_PLAYERS_KEPT_AFTER = 2;

// --- La Joute : finale à 2, énigme à révélation progressive, valeur qui décroît, filet QCM en secours ---
export const JOUTE_QUESTION_TIME_MS = 20_000;
export const JOUTE_WRONG_LOCKOUT_MS = 3_000;
export const JOUTE_FILET_THRESHOLD = 30;
export const JOUTE_WIN_SCORE = 200;
export const JOUTE_MAX_QUESTIONS = 10;

export interface JouteValueTier {
    maxElapsedMs: number;
    points: number;
}

/** Palier de points selon le temps écoulé depuis l'ouverture de la question, du plus rapide au plus lent. */
export const JOUTE_VALUE_TIERS: readonly JouteValueTier[] = [
    {maxElapsedMs: 4_000, points: 50},
    {maxElapsedMs: 8_000, points: 40},
    {maxElapsedMs: 12_000, points: 30},
    {maxElapsedMs: 16_000, points: 20},
    {maxElapsedMs: 20_000, points: 10},
];

/** Fenêtre pendant laquelle un joueur déconnecté peut revenir sans être traité comme éliminé/forfait. */
export const RECONNECT_GRACE_MS = 30_000;

/** Valeur en points de l'énigme de la Joute au temps écoulé donné, ou 0 si la fenêtre de 20 s est dépassée. */
export function jouteValueForElapsed(elapsedMs: number): number {
    const tier = JOUTE_VALUE_TIERS.find((candidate) => elapsedMs <= candidate.maxElapsedMs);
    return tier ? tier.points : 0;
}

/** Points du 1er/2e/3e/4e à répondre correctement en Mêlée, ou 0 au-delà (ne devrait pas arriver à 4 joueurs). */
export function meleeSpeedPoints(rank: number): number {
    return MELEE_SPEED_POINTS[rank] ?? 0;
}

/** Multiplicateur de la Charge pour une série de `streak` bonnes réponses consécutives, plafonné. */
export function chargeMultiplierForStreak(streak: number): number {
    const index = Math.min(streak, CHARGE_MULTIPLIERS.length - 1);
    return CHARGE_MULTIPLIERS[index];
}
