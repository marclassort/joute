import {EpreuveKind, OneWinnerStageId} from "@/game/oneWinnerTypes";

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
