import {StreakState, XP_PER_LEVEL, computeLevel, computeLevelProgress, dateKey, updateStreak} from "./gamification";

describe("computeLevel", () => {
    it("commence au niveau 1 sans XP", () => {
        expect(computeLevel(0)).toBe(1);
    });

    it("passe au niveau 2 à XP_PER_LEVEL", () => {
        expect(computeLevel(XP_PER_LEVEL)).toBe(2);
    });

    it("reste au niveau 1 juste avant le seuil", () => {
        expect(computeLevel(XP_PER_LEVEL - 1)).toBe(1);
    });

    it("ne descend jamais sous le niveau 1, même avec un XP négatif", () => {
        expect(computeLevel(-50)).toBe(1);
    });
});

describe("computeLevelProgress", () => {
    it("est à 0 juste après être monté de niveau", () => {
        expect(computeLevelProgress(XP_PER_LEVEL)).toBe(0);
    });

    it("est à 0.5 à mi-chemin du niveau suivant", () => {
        expect(computeLevelProgress(XP_PER_LEVEL / 2)).toBe(0.5);
    });
});

describe("dateKey", () => {
    it("formate un timestamp en clé YYYY-MM-DD", () => {
        expect(dateKey(new Date("2026-03-05T10:00:00Z").getTime())).toBe("2026-03-05");
    });
});

describe("updateStreak", () => {
    const fresh: StreakState = {currentStreak: 0, longestStreak: 0, lastPlayedDate: null};

    it("démarre une série à 1 pour la première partie jouée", () => {
        const updated = updateStreak(fresh, "2026-03-05");
        expect(updated).toEqual({currentStreak: 1, longestStreak: 1, lastPlayedDate: "2026-03-05"});
    });

    it("ne change rien si on rejoue le même jour", () => {
        const state: StreakState = {currentStreak: 3, longestStreak: 5, lastPlayedDate: "2026-03-05"};
        expect(updateStreak(state, "2026-03-05")).toEqual(state);
    });

    it("incrémente la série en jouant le jour suivant", () => {
        const state: StreakState = {currentStreak: 3, longestStreak: 5, lastPlayedDate: "2026-03-05"};
        expect(updateStreak(state, "2026-03-06")).toEqual({currentStreak: 4, longestStreak: 5, lastPlayedDate: "2026-03-06"});
    });

    it("met à jour le record quand la série dépasse le précédent record", () => {
        const state: StreakState = {currentStreak: 5, longestStreak: 5, lastPlayedDate: "2026-03-05"};
        expect(updateStreak(state, "2026-03-06")).toEqual({currentStreak: 6, longestStreak: 6, lastPlayedDate: "2026-03-06"});
    });

    it("remet la série à 1 si un jour a été sauté", () => {
        const state: StreakState = {currentStreak: 6, longestStreak: 6, lastPlayedDate: "2026-03-05"};
        expect(updateStreak(state, "2026-03-08")).toEqual({currentStreak: 1, longestStreak: 6, lastPlayedDate: "2026-03-08"});
    });
});
