import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {localStreakStatsRepository} from "./localStreakStatsRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe("localStreakStatsRepository", () => {
    it("part d'un record à 0", async () => {
        expect(await localStreakStatsRepository.get()).toEqual({bestStreak: 0});
    });

    it("enregistre le premier record", async () => {
        const stats = await localStreakStatsRepository.recordRun(5);
        expect(stats).toEqual({bestStreak: 5});
    });

    it("garde le meilleur record entre deux parties", async () => {
        await localStreakStatsRepository.recordRun(5);
        const stats = await localStreakStatsRepository.recordRun(3);
        expect(stats).toEqual({bestStreak: 5});
    });

    it("met à jour le record quand il est battu", async () => {
        await localStreakStatsRepository.recordRun(5);
        const stats = await localStreakStatsRepository.recordRun(8);
        expect(stats).toEqual({bestStreak: 8});
    });
});
