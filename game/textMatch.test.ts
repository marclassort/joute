import {isAnswerCorrect, normalizeAnswer} from "./textMatch";

describe("normalizeAnswer", () => {
    it("met en minuscules, retire les accents et la ponctuation, trim les espaces", () => {
        expect(normalizeAnswer("  Le Danube !  ")).toBe("le danube");
    });

    it("normalise les espaces multiples", () => {
        expect(normalizeAnswer("Vienne   Budapest")).toBe("vienne budapest");
    });
});

describe("isAnswerCorrect", () => {
    it("accepte une réponse strictement identique", () => {
        expect(isAnswerCorrect("Danube", "Danube")).toBe(true);
    });

    it("ignore la casse et les accents", () => {
        expect(isAnswerCorrect("cleopatre", "Cléopâtre")).toBe(true);
    });

    it("tolère une petite faute de frappe", () => {
        expect(isAnswerCorrect("Danub", "Danube")).toBe(true);
    });

    it("refuse une réponse trop différente", () => {
        expect(isAnswerCorrect("Rhin", "Danube")).toBe(false);
    });

    it("refuse une saisie vide", () => {
        expect(isAnswerCorrect("", "Danube")).toBe(false);
        expect(isAnswerCorrect("   ", "Danube")).toBe(false);
    });

    it("refuse une réponse partiellement correcte mais tronquée au-delà de la tolérance", () => {
        expect(isAnswerCorrect("Da", "Danube")).toBe(false);
    });
});
