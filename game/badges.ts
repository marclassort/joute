import {Category} from "./types";
import {CategoryStats, SoloStats} from "@/services/localSoloStatsRepository";

export interface Badge {
    id: string;
    label: string;
    icon: string;
}

export interface BadgeContext {
    soloStats: SoloStats;
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    duelWins: number;
    plateauWins: number;
    bestFreeAnswerStreak: number;
    level: number;
}

const MASTERY_BADGE_THRESHOLD = 80;
const MASTERY_BADGE_MIN_PLAYED = 5;

const STREAK_MILESTONES = [3, 7, 14, 30];
const LEVEL_MILESTONES = [5, 10, 20, 30];

const CATEGORY_LABELS_FOR_BADGES: Record<Category, string> = {
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

function masteryBadges(soloStats: SoloStats): Badge[] {
    const entries = Object.entries(soloStats) as [Category, CategoryStats][];
    return entries
        .filter(([, stats]) => stats.played >= MASTERY_BADGE_MIN_PLAYED && Math.round((stats.correct / stats.played) * 100) >= MASTERY_BADGE_THRESHOLD)
        .map(([category]) => ({id: `mastery-${category}`, label: `Maître de ${CATEGORY_LABELS_FOR_BADGES[category]}`, icon: "🏛️"}));
}

function streakBadges(longestStreak: number): Badge[] {
    return STREAK_MILESTONES.filter((milestone) => longestStreak >= milestone).map((milestone) => ({
        id: `streak-${milestone}`,
        label: `Série de ${milestone} jours`,
        icon: "🔥",
    }));
}

function levelBadges(level: number): Badge[] {
    return LEVEL_MILESTONES.filter((milestone) => level >= milestone).map((milestone) => ({
        id: `level-${milestone}`,
        label: `Niveau ${milestone}`,
        icon: "⭐",
    }));
}

/** Calcule tous les badges gagnés à partir des données déjà suivies ailleurs (maîtrise solo, gamification, historique de parties) — aucun nouvel état à persister. */
export function computeEarnedBadges(ctx: BadgeContext): Badge[] {
    const badges: Badge[] = [];

    badges.push(...masteryBadges(ctx.soloStats));
    badges.push(...streakBadges(ctx.longestStreak));
    badges.push(...levelBadges(ctx.level));

    if (ctx.duelWins >= 1) badges.push({id: "first-duel-win", label: "Premier duel remporté", icon: "⚡"});
    if (ctx.plateauWins >= 1) badges.push({id: "first-plateau-win", label: "Vétéran du plateau", icon: "🏟️"});
    if (ctx.bestFreeAnswerStreak >= 4) badges.push({id: "four-in-a-row", label: "4 à la suite", icon: "🎯"});

    return badges;
}
