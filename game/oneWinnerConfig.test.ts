import {defiPointsForElapsed, nextStageId, stageRulesFor} from "./oneWinnerConfig";

describe("defiPointsForElapsed", () => {
    it("attribue le palier le plus rapide en cas d'égalité sur la borne", () => {
        expect(defiPointsForElapsed(3_000)).toBe(100);
    });

    it("attribue un palier intermédiaire", () => {
        expect(defiPointsForElapsed(4_500)).toBe(70);
    });

    it("attribue le palier le plus lent encore dans les temps", () => {
        expect(defiPointsForElapsed(9_999)).toBe(40);
    });

    it("retourne 0 au-delà de tous les paliers", () => {
        expect(defiPointsForElapsed(20_000)).toBe(0);
    });
});

describe("stageRulesFor", () => {
    it("retrouve la configuration d'une étape connue", () => {
        expect(stageRulesFor("main").playersKeptAfter).toBe(3);
    });

    it("lève une erreur pour une étape inconnue", () => {
        // @ts-expect-error volontaire : simule une valeur invalide venue du réseau/backend
        expect(() => stageRulesFor("bonus")).toThrow();
    });
});

describe("nextStageId", () => {
    it("enchaîne main -> semifinal -> final -> null", () => {
        expect(nextStageId("main")).toBe("semifinal");
        expect(nextStageId("semifinal")).toBe("final");
        expect(nextStageId("final")).toBeNull();
    });
});
