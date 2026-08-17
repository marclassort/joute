import {OneWinnerRoundId} from "@/game/oneWinnerTypes";
import {LeagueTier} from "@/game/oneWinnerRankingTypes";

export const ROUND_LABELS: Record<OneWinnerRoundId, {title: string; players: string; chips: string[]}> = {
    melee: {
        title: "La Mêlée",
        players: "4 joueurs",
        chips: ["10 s par question", "100 · 70 · 40 · 20 selon la vitesse", "Le dernier cumulé sort"],
    },
    charge: {
        title: "La Charge",
        players: "3 joueurs",
        chips: ["60 s en parallèle", "50 pts × multiplicateur", "Erreur ou passe : retour à ×1"],
    },
    joute: {
        title: "La Joute",
        players: "2 joueurs",
        chips: ["50 → 10 pts en 20 s", "Filet QCM dès 30 pts", "Premier à 200 gagne"],
    },
};

export const ROUND_ORDER: readonly OneWinnerRoundId[] = ["melee", "charge", "joute"];

export const LEAGUE_TIER_LABELS: Record<LeagueTier, string> = {
    initie: "Initié",
    curieux: "Curieux",
    erudit: "Érudit",
    expert: "Expert",
    maitre: "Maître",
    "grand-maitre": "Grand Maître",
    legende: "Légende",
};

const DIVISION_NUMERALS = ["I", "II", "III"];

/** "Légende" n'a qu'une seule division : on n'affiche jamais de chiffre pour ce palier. */
export function formatLeagueRank(tier: LeagueTier, division: number): string {
    if (tier === "legende") return LEAGUE_TIER_LABELS[tier];
    return `${LEAGUE_TIER_LABELS[tier]} ${DIVISION_NUMERALS[division - 1] ?? division}`;
}
