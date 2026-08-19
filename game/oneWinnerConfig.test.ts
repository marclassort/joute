import {chargeMultiplierForStreak, jouteValueForElapsed, meleeSpeedPoints} from "./oneWinnerConfig";

describe("jouteValueForElapsed", () => {
    it("attribue le palier le plus rapide en cas d'égalité sur la borne", () => {
        expect(jouteValueForElapsed(6_000)).toBe(50);
    });

    it("attribue un palier intermédiaire", () => {
        expect(jouteValueForElapsed(13_000)).toBe(30);
    });

    it("attribue le dernier palier encore dans les temps", () => {
        expect(jouteValueForElapsed(30_000)).toBe(10);
    });

    it("retourne 0 au-delà de la fenêtre de 30 secondes", () => {
        expect(jouteValueForElapsed(30_001)).toBe(0);
    });
});

describe("meleeSpeedPoints", () => {
    it("attribue 100/70/40/20 du 1er au 4e à répondre correctement", () => {
        expect(meleeSpeedPoints(0)).toBe(100);
        expect(meleeSpeedPoints(1)).toBe(70);
        expect(meleeSpeedPoints(2)).toBe(40);
        expect(meleeSpeedPoints(3)).toBe(20);
    });

    it("retourne 0 au-delà de la 4e place (ne devrait pas arriver à 4 joueurs)", () => {
        expect(meleeSpeedPoints(4)).toBe(0);
    });
});

describe("chargeMultiplierForStreak", () => {
    it("commence à ×1 sans série", () => {
        expect(chargeMultiplierForStreak(0)).toBe(1);
    });

    it("monte avec la série", () => {
        expect(chargeMultiplierForStreak(1)).toBe(1.2);
        expect(chargeMultiplierForStreak(2)).toBe(1.4);
    });

    it("plafonne à ×2 au-delà de la dernière marche", () => {
        expect(chargeMultiplierForStreak(5)).toBe(2);
        expect(chargeMultiplierForStreak(50)).toBe(2);
    });
});
