import AsyncStorage from "@react-native-async-storage/async-storage";
import {Category} from "@/game/types";

export interface CategoryStats {
    played: number;
    correct: number;
}

export type SoloStats = Partial<Record<Category, CategoryStats>>;

const STORAGE_KEY = "joute:solo-stats";

/** Seuil de réussite en dessous duquel un thème est considéré « à travailler ». */
export const MASTERY_THRESHOLD = 50;

/** Pourcentage de réussite d'un thème, ou null si le joueur n'y a encore jamais joué. */
export function masteryPercent(stats: CategoryStats | undefined): number | null {
    if (!stats || stats.played === 0) return null;
    return Math.round((stats.correct / stats.played) * 100);
}

/** Un thème est « à travailler » s'il n'a jamais été joué ou si le taux de réussite est sous le seuil. */
export function needsWork(stats: CategoryStats | undefined): boolean {
    const percent = masteryPercent(stats);
    return percent === null || percent < MASTERY_THRESHOLD;
}

async function readAll(): Promise<SoloStats> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SoloStats) : {};
}

export const localSoloStatsRepository = {
    async getAll(): Promise<SoloStats> {
        return readAll();
    },
    async recordSession(category: Category, correct: number, total: number): Promise<SoloStats> {
        const stats = await readAll();
        const existing = stats[category] ?? {played: 0, correct: 0};
        const updated: SoloStats = {
            ...stats,
            [category]: {played: existing.played + total, correct: existing.correct + correct},
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    },
};
