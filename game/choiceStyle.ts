import {plateauColors} from "@/constants/theme";

/** États de révélation des tuiles de réponse QCM, charte v2 (project-update/). Partagé entre les modes Duel et Solo. */
export interface ChoiceStyle {
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    badgeBackgroundColor: string;
    badgeTextColor: string;
}

const DEFAULT_CHOICE_STYLE: ChoiceStyle = {
    backgroundColor: "rgba(246,240,230,0.07)",
    borderColor: "rgba(246,240,230,0.18)",
    textColor: plateauColors.paper,
    badgeBackgroundColor: "rgba(246,240,230,0.14)",
    badgeTextColor: plateauColors.paper,
};

const CORRECT_CHOICE_STYLE: ChoiceStyle = {
    backgroundColor: plateauColors.teal,
    borderColor: plateauColors.teal,
    textColor: plateauColors.ink,
    badgeBackgroundColor: plateauColors.ink,
    badgeTextColor: plateauColors.teal,
};

const WRONG_CHOSEN_CHOICE_STYLE: ChoiceStyle = {
    backgroundColor: "rgba(231,90,142,0.22)",
    borderColor: plateauColors.rose,
    textColor: plateauColors.paper,
    badgeBackgroundColor: plateauColors.rose,
    badgeTextColor: "#fff",
};

const DIMMED_CHOICE_STYLE: ChoiceStyle = {
    backgroundColor: "rgba(246,240,230,0.04)",
    borderColor: "rgba(246,240,230,0.08)",
    textColor: "rgba(246,240,230,0.4)",
    badgeBackgroundColor: "rgba(246,240,230,0.08)",
    badgeTextColor: "rgba(246,240,230,0.4)",
};

export function resolveChoiceStyle(index: number, isAnswered: boolean, selectedIndex: number | null, correctIndex: number): ChoiceStyle {
    if (!isAnswered) return DEFAULT_CHOICE_STYLE;
    if (index === correctIndex) return CORRECT_CHOICE_STYLE;
    if (index === selectedIndex) return WRONG_CHOSEN_CHOICE_STYLE;
    return DIMMED_CHOICE_STYLE;
}
