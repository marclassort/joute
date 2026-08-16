/**
 * Le Rating (compétitif, façon ELO) est un système à part entière de l'XP (progression/niveau, voir
 * gamification.ts) : l'XP mesure l'activité et ne baisse jamais, le Rating mesure la performance
 * relative en "UN SEUL GAGNANT" et peut monter ou descendre à chaque partie.
 *
 * Pas de système de saisons pour cette passe (décision explicite) : le Rating est permanent, pas de
 * réinitialisation périodique — à construire dans une passe dédiée si besoin.
 */
export type LeagueTier =
    | "initie"
    | "curieux"
    | "erudit"
    | "expert"
    | "maitre"
    | "grand-maitre"
    | "legende";

export const LEAGUE_TIERS: readonly LeagueTier[] = [
    "initie",
    "curieux",
    "erudit",
    "expert",
    "maitre",
    "grand-maitre",
    "legende",
];

/** "Légende" n'a qu'une seule division ; les autres paliers en ont 3 (1 = la plus haute, la plus proche du palier suivant). */
export interface LeagueRank {
    tier: LeagueTier;
    division: number;
}

export interface PlayerRating {
    playerId: string;
    rating: number;
    tier: LeagueTier;
    division: number;
    gamesPlayed: number;
    updatedAt: number;
}
