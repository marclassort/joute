import AsyncStorage from "@react-native-async-storage/async-storage";
import {Match} from "@/game/types";
import {MatchRepository} from "./matchRepository";

const STORAGE_KEY = "joute:matches";

async function readAll(): Promise<Record<string, Match>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Match>) : {};
}

async function writeAll(matches: Record<string, Match>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

export const localMatchRepository: MatchRepository = {
    async list() {
        const matches = await readAll();
        return Object.values(matches);
    },
    async get(matchId) {
        const matches = await readAll();
        return matches[matchId] ?? null;
    },
    async save(match) {
        const matches = await readAll();
        matches[match.id] = match;
        await writeAll(matches);
    },
};
