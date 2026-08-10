import {Category} from "@/game/types";

export const CATEGORY_LABELS: Record<Category, string> = {
    histoire: "Histoire",
    geographie: "Géographie",
    sciences: "Sciences",
    nature: "Nature",
    arts: "Arts",
    musique: "Musique",
    cinema: "Cinéma",
    sport: "Sport",
    societe: "Société",
    "culture-pop": "Culture pop",
    gastronomie: "Gastronomie",
    langue: "Langue",
    logique: "Logique",
    insolite: "Insolite",
    actualite: "Actualité",
};

export const CATEGORY_ICONS: Record<Category, string> = {
    histoire: "🏛️",
    geographie: "🌍",
    sciences: "🔬",
    nature: "🌿",
    arts: "🎨",
    musique: "🎵",
    cinema: "🎬",
    sport: "⚽",
    societe: "⚖️",
    "culture-pop": "📱",
    gastronomie: "🍽️",
    langue: "🔤",
    logique: "🧩",
    insolite: "✨",
    actualite: "📰",
};

export const CATEGORY_COLORS: Record<Category, string> = {
    histoire: "#e8c9a0",
    geographie: "#a8d8e8",
    sciences: "#b8d4e3",
    nature: "#b8e8d0",
    arts: "#f5c542",
    musique: "#e8def8",
    cinema: "#f5a3c7",
    sport: "#a3e8c4",
    societe: "#d4c5f9",
    "culture-pop": "#f5b8a3",
    gastronomie: "#f9d9a8",
    langue: "#c7e8f5",
    logique: "#d0e8b8",
    insolite: "#f9c9e0",
    actualite: "#e0e0e0",
};

export const QUESTION_DURATION_MS = 15_000;
export const QUESTION_ALERT_THRESHOLD_MS = 4_000;
export const QUESTION_TRANSITION_MS = 250;
