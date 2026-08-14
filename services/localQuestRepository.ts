import AsyncStorage from "@react-native-async-storage/async-storage";
import {isFastCorrectAnswer} from "@/game/quests";

export interface QuestStats {
    fastAnswers: number;
}

const STORAGE_KEY = "joute:quest-stats";
const EMPTY_STATS: QuestStats = {fastAnswers: 0};

async function readStats(): Promise<QuestStats> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuestStats) : EMPTY_STATS;
}

export const localQuestRepository = {
    async get(): Promise<QuestStats> {
        return readStats();
    },

    /** Incrémente le compteur de réponses rapides. No-op si la réponse n'est pas correcte et rapide (voir game/quests.ts). */
    async recordAnswer(isCorrect: boolean, elapsedMs: number): Promise<QuestStats> {
        if (!isFastCorrectAnswer(isCorrect, elapsedMs)) return readStats();

        const stats = await readStats();
        const updated: QuestStats = {fastAnswers: stats.fastAnswers + 1};
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    },
};
