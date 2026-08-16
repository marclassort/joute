import {LeagueRank, LeagueTier} from "./oneWinnerRankingTypes";

export const STARTING_RATING = 1000;

/**
 * K-factor Elo : borne la variation maximale de Rating sur UNE partie, toutes tailles de table
 * confondues (le calcul par paires est moyenné sur les adversaires, voir computeRatingChanges) — même
 * valeur standard utilisée aux échecs pour un joueur non-débutant.
 */
export const ONE_WINNER_ELO_K = 32;

interface TierBand {
    tier: LeagueTier;
    min: number;
    /** null = palier ouvert vers le haut (Légende). */
    max: number | null;
}

/** Paliers à tranches de 200 points, 1000 de départ ; Légende (2000+) n'a qu'une seule division. */
const TIER_BANDS: readonly TierBand[] = [
    {tier: "initie", min: 0, max: 999},
    {tier: "curieux", min: 1000, max: 1199},
    {tier: "erudit", min: 1200, max: 1399},
    {tier: "expert", min: 1400, max: 1599},
    {tier: "maitre", min: 1600, max: 1799},
    {tier: "grand-maitre", min: 1800, max: 1999},
    {tier: "legende", min: 2000, max: null},
];

/** Palier + division pour un Rating donné. 3 divisions par palier (1 = la plus haute), sauf Légende. */
export function leagueRankForRating(rating: number): LeagueRank {
    const clamped = Math.max(0, rating);
    const band = TIER_BANDS.find((entry) => clamped >= entry.min && (entry.max === null || clamped <= entry.max)) ?? TIER_BANDS[0];

    if (band.max === null) {
        return {tier: band.tier, division: 1};
    }

    const width = (band.max - band.min + 1) / 3;
    const offset = clamped - band.min;
    const division = 3 - Math.min(2, Math.floor(offset / width));
    return {tier: band.tier, division};
}

export interface OneWinnerRatingStanding {
    playerId: string;
    /** 1 = vainqueur, classement final complet de la partie (pas seulement les éliminés d'une étape). */
    finalRank: number;
}

export interface RatingChange {
    playerId: string;
    ratingBefore: number;
    ratingAfter: number;
    delta: number;
    tier: LeagueTier;
    division: number;
}

/**
 * Variation de Rating façon Elo, adaptée à N joueurs (pas un simple 1 contre 1) : chaque joueur est
 * comparé à chacun des autres selon le classement final (mieux classé = "gagne" cette comparaison par
 * paire), la variation totale est la moyenne des variations Elo standard sur toutes les paires — prend
 * en compte la force relative des adversaires, somme nulle sur l'ensemble de la table.
 */
export function computeRatingChanges(
    standings: readonly OneWinnerRatingStanding[],
    currentRatings: Readonly<Record<string, number>>,
    k: number = ONE_WINNER_ELO_K,
): RatingChange[] {
    const playerCount = standings.length;
    const ratingOf = (playerId: string) => currentRatings[playerId] ?? STARTING_RATING;

    return standings.map((entry) => {
        const ratingBefore = ratingOf(entry.playerId);

        let sum = 0;
        for (const opponent of standings) {
            if (opponent.playerId === entry.playerId) continue;
            const opponentRating = ratingOf(opponent.playerId);
            const expected = 1 / (1 + Math.pow(10, (opponentRating - ratingBefore) / 400));
            const actual = entry.finalRank < opponent.finalRank ? 1 : 0;
            sum += actual - expected;
        }

        const delta = playerCount > 1 ? Math.round((k / (playerCount - 1)) * sum) : 0;
        const ratingAfter = Math.max(0, ratingBefore + delta);
        const rank = leagueRankForRating(ratingAfter);

        return {playerId: entry.playerId, ratingBefore, ratingAfter, delta, tier: rank.tier, division: rank.division};
    });
}
