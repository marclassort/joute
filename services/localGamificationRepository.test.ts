import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {localGamificationRepository} from "./localGamificationRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

const DAY_1 = new Date("2026-03-05T10:00:00Z").getTime();
const DAY_2 = new Date("2026-03-06T10:00:00Z").getTime();

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe("localGamificationRepository", () => {
    it("part d'un état vide", async () => {
        expect(await localGamificationRepository.get()).toEqual({
            totalXp: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastPlayedDate: null,
            rewardedMatchIds: [],
        });
    });

    it("crédite l'XP et démarre la série au premier awardXp", async () => {
        const state = await localGamificationRepository.awardXp(20, DAY_1);
        expect(state.totalXp).toBe(20);
        expect(state.currentStreak).toBe(1);
        expect(state.lastPlayedDate).toBe("2026-03-05");
    });

    it("cumule l'XP sur plusieurs appels", async () => {
        await localGamificationRepository.awardXp(20, DAY_1);
        const state = await localGamificationRepository.awardXp(15, DAY_1);
        expect(state.totalXp).toBe(35);
    });

    it("incrémente la série le jour suivant", async () => {
        await localGamificationRepository.awardXp(10, DAY_1);
        const state = await localGamificationRepository.awardXp(10, DAY_2);
        expect(state.currentStreak).toBe(2);
    });

    it("awardXpForMatch ne crédite qu'une seule fois pour un même matchId", async () => {
        await localGamificationRepository.awardXpForMatch("match-1", 50, DAY_1);
        const state = await localGamificationRepository.awardXpForMatch("match-1", 50, DAY_1);
        expect(state.totalXp).toBe(50);
        expect(state.rewardedMatchIds).toEqual(["match-1"]);
    });

    it("awardXpForMatch crédite des matchs différents indépendamment", async () => {
        await localGamificationRepository.awardXpForMatch("match-1", 50, DAY_1);
        const state = await localGamificationRepository.awardXpForMatch("match-2", 30, DAY_1);
        expect(state.totalXp).toBe(80);
        expect(state.rewardedMatchIds.sort()).toEqual(["match-1", "match-2"]);
    });
});
