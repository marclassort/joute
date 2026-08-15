/**
 * Le Rating (compétitif, façon ELO) est un système à part entière de l'XP (progression/niveau, voir
 * gamification.ts) : l'XP mesure l'activité et ne baisse jamais, le Rating mesure la performance
 * relative en "UN SEUL GAGNANT" et peut monter ou descendre à chaque partie.
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

/** "Légende" n'a qu'une seule division ; les autres paliers en ont plusieurs (1 = la plus haute). */
export interface LeagueRank {
    tier: LeagueTier;
    division: number;
}

export interface Season {
    id: string;
    startsAt: number;
    endsAt: number;
    isActive: boolean;
}

export interface PlayerRating {
    playerId: string;
    seasonId: string;
    rating: number;
    tier: LeagueTier;
    division: number;
    gamesPlayed: number;
    updatedAt: number;
}

export type LeaderboardScope = "world" | "national" | "friends" | "seasonal";

export interface LeaderboardEntry {
    playerId: string;
    displayName: string;
    avatarUrl: string | null;
    rating: number;
    tier: LeagueTier;
    division: number;
    rank: number;
}
