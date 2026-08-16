import {EpreuveKind, OneWinnerStageId} from "@/game/oneWinnerTypes";
import {LeagueTier} from "@/game/oneWinnerRankingTypes";

export const EPREUVE_LABELS: Record<EpreuveKind, {label: string; icon: string; instructions: string}> = {
    defi: {label: "Le Défi", icon: "⚡", instructions: "Tout le monde répond en même temps — plus vite, plus de points."},
    buzzer: {label: "Le Buzzer", icon: "🔔", instructions: "Premier à buzzer, premier à répondre — une erreur passe la main."},
    conquete: {label: "La Conquête", icon: "🎲", instructions: "Misez une partie de votre score avant de répondre."},
};

export const STAGE_TITLES: Record<OneWinnerStageId, string> = {
    main: "Étape principale",
    semifinal: "Demi-finale",
    final: "Finale",
};

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
