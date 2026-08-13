import {BadgeContext, computeEarnedBadges} from "./badges";

function buildContext(overrides: Partial<BadgeContext> = {}): BadgeContext {
    return {
        soloStats: {},
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0,
        duelWins: 0,
        plateauWins: 0,
        bestFreeAnswerStreak: 0,
        level: 1,
        ...overrides,
    };
}

describe("computeEarnedBadges", () => {
    it("ne retourne aucun badge pour un joueur qui n'a rien fait", () => {
        expect(computeEarnedBadges(buildContext())).toEqual([]);
    });

    it("attribue un badge de maîtrise à 80% et plus avec au moins 5 questions jouées", () => {
        const badges = computeEarnedBadges(buildContext({soloStats: {histoire: {played: 10, correct: 8}}}));
        expect(badges).toContainEqual({id: "mastery-histoire", label: "Maître de Histoire", icon: "🏛️"});
    });

    it("n'attribue pas de badge de maîtrise sous le seuil de 80%", () => {
        const badges = computeEarnedBadges(buildContext({soloStats: {histoire: {played: 10, correct: 7}}}));
        expect(badges.some((b) => b.id === "mastery-histoire")).toBe(false);
    });

    it("n'attribue pas de badge de maîtrise avec un échantillon trop petit, même à 100%", () => {
        const badges = computeEarnedBadges(buildContext({soloStats: {histoire: {played: 2, correct: 2}}}));
        expect(badges.some((b) => b.id === "mastery-histoire")).toBe(false);
    });

    it("attribue tous les paliers de série atteints, pas seulement le plus haut", () => {
        const badges = computeEarnedBadges(buildContext({longestStreak: 10}));
        const ids = badges.map((b) => b.id);
        expect(ids).toEqual(expect.arrayContaining(["streak-3", "streak-7"]));
        expect(ids).not.toContain("streak-14");
    });

    it("attribue les paliers de niveau atteints", () => {
        const badges = computeEarnedBadges(buildContext({level: 12}));
        const ids = badges.map((b) => b.id);
        expect(ids).toEqual(expect.arrayContaining(["level-5", "level-10"]));
        expect(ids).not.toContain("level-20");
    });

    it("attribue le badge de première victoire en duel", () => {
        const badges = computeEarnedBadges(buildContext({duelWins: 3}));
        expect(badges).toContainEqual({id: "first-duel-win", label: "Premier duel remporté", icon: "⚡"});
    });

    it("attribue le badge de première victoire au plateau", () => {
        const badges = computeEarnedBadges(buildContext({plateauWins: 1}));
        expect(badges).toContainEqual({id: "first-plateau-win", label: "Vétéran du plateau", icon: "🏟️"});
    });

    it("attribue le badge « 4 à la suite » à partir d'une série de 4 bonnes réponses libres", () => {
        expect(computeEarnedBadges(buildContext({bestFreeAnswerStreak: 4})).some((b) => b.id === "four-in-a-row")).toBe(true);
        expect(computeEarnedBadges(buildContext({bestFreeAnswerStreak: 3})).some((b) => b.id === "four-in-a-row")).toBe(false);
    });
});
