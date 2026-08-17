import {OneWinnerRoundId} from "@/game/oneWinnerTypes";
import {LeagueTier} from "@/game/oneWinnerRankingTypes";

export const ROUND_ORDER: readonly OneWinnerRoundId[] = ["melee", "charge", "joute"];

/** `tint` référence une clé de constants/theme.ts plateauColors — appliquée en style inline (interpoler
 * une classe Tailwind dynamique ne s'applique pas de façon fiable avec cette version de NativeWind). */
export const ROUND_LABELS: Record<OneWinnerRoundId, {step: string; title: string; sub: string; players: string; tint: "teal" | "iris" | "brass"; chips: string[]}> = {
    melee: {
        step: "01",
        title: "La Mêlée",
        sub: "6 QCM, tous ensemble",
        players: "4 joueurs",
        tint: "teal",
        chips: ["10 s par question", "100 · 70 · 40 · 20 selon la vitesse", "Le dernier cumulé sort"],
    },
    charge: {
        step: "02",
        title: "La Charge",
        sub: "Ton thème, ta série, au clavier",
        players: "3 joueurs",
        tint: "iris",
        chips: ["60 s en parallèle", "50 pts × multiplicateur", "Erreur ou passe : retour à ×1"],
    },
    joute: {
        step: "03",
        title: "La Joute",
        sub: "Énigme qui se dévoile, valeur qui fond",
        players: "2 joueurs",
        tint: "brass",
        chips: ["50 → 10 pts en 20 s", "Filet QCM dès 30 pts", "Premier à 200 gagne"],
    },
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
