import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {localSoloStatsRepository, masteryPercent, needsWork} from "./localSoloStatsRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe("localSoloStatsRepository", () => {
    it("retourne un objet vide quand rien n'a été joué", async () => {
        expect(await localSoloStatsRepository.getAll()).toEqual({});
    });

    it("enregistre une première session pour un thème", async () => {
        const stats = await localSoloStatsRepository.recordSession("histoire", 7, 10);
        expect(stats.histoire).toEqual({played: 10, correct: 7});
    });

    it("cumule les sessions successives d'un même thème", async () => {
        await localSoloStatsRepository.recordSession("histoire", 7, 10);
        const stats = await localSoloStatsRepository.recordSession("histoire", 5, 10);
        expect(stats.histoire).toEqual({played: 20, correct: 12});
    });

    it("garde les thèmes distincts séparés", async () => {
        await localSoloStatsRepository.recordSession("histoire", 7, 10);
        const stats = await localSoloStatsRepository.recordSession("geographie", 4, 10);
        expect(stats.histoire).toEqual({played: 10, correct: 7});
        expect(stats.geographie).toEqual({played: 10, correct: 4});
    });
});

describe("masteryPercent", () => {
    it("retourne null quand le thème n'a jamais été joué", () => {
        expect(masteryPercent(undefined)).toBeNull();
    });

    it("arrondit le taux de réussite au pourcent le plus proche", () => {
        expect(masteryPercent({played: 3, correct: 2})).toBe(67);
    });
});

describe("needsWork", () => {
    it("est vrai pour un thème jamais joué", () => {
        expect(needsWork(undefined)).toBe(true);
    });

    it("est vrai sous le seuil de maîtrise", () => {
        expect(needsWork({played: 10, correct: 4})).toBe(true);
    });

    it("est faux au-dessus du seuil de maîtrise", () => {
        expect(needsWork({played: 10, correct: 6})).toBe(false);
    });
});
