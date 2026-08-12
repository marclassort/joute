import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "joute:streak-stats";

export interface StreakStats {
    bestStreak: number;
}

async function readStats(): Promise<StreakStats> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StreakStats) : {bestStreak: 0};
}

export const localStreakStatsRepository = {
    async get(): Promise<StreakStats> {
        return readStats();
    },
    async recordRun(finalStreak: number): Promise<StreakStats> {
        const stats = await readStats();
        const updated: StreakStats = {bestStreak: Math.max(stats.bestStreak, finalStreak)};
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    },
};
