import AsyncStorage from "@react-native-async-storage/async-storage";
import {PlateauMatch} from "@/game/types";

const STORAGE_KEY = "joute:plateau-matches";

async function readAll(): Promise<Record<string, PlateauMatch>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PlateauMatch>) : {};
}

async function writeAll(matches: Record<string, PlateauMatch>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
}

export const localPlateauMatchRepository = {
    async list(): Promise<PlateauMatch[]> {
        const matches = await readAll();
        return Object.values(matches);
    },
    async get(matchId: string): Promise<PlateauMatch | null> {
        const matches = await readAll();
        return matches[matchId] ?? null;
    },
    async save(match: PlateauMatch): Promise<void> {
        const matches = await readAll();
        matches[match.id] = match;
        await writeAll(matches);
    },
};
