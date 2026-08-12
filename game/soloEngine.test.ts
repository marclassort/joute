import {Question} from "./types";
import {buildSoloAnswer, computeAverageResponseMs, computeLongestCorrectStreak, computeSoloScore} from "./soloEngine";

function buildQuestion(overrides: Partial<Question> = {}): Question {
    return {
        id: "q1",
        category: "histoire",
        difficulty: 1,
        statement: "?",
        choices: ["a", "b", "c", "d"],
        correctIndex: 0,
        explanation: "parce que",
        perishable: false,
        ...overrides,
    };
}

describe("buildSoloAnswer", () => {
    it("marque la réponse correcte quand l'index sélectionné correspond à correctIndex", () => {
        const answer = buildSoloAnswer(buildQuestion({correctIndex: 2}), 2, 4200);
        expect(answer).toEqual({questionId: "q1", selectedIndex: 2, isCorrect: true, elapsedMs: 4200});
    });

    it("marque la réponse incorrecte quand l'index sélectionné diffère de correctIndex", () => {
        const answer = buildSoloAnswer(buildQuestion({correctIndex: 2}), 1, 3000);
        expect(answer.isCorrect).toBe(false);
    });

    it("marque la réponse incorrecte quand aucun index n'a été sélectionné (timeout)", () => {
        const answer = buildSoloAnswer(buildQuestion({correctIndex: 0}), null, 15000);
        expect(answer.isCorrect).toBe(false);
        expect(answer.selectedIndex).toBeNull();
    });
});

describe("computeSoloScore", () => {
    it("compte une réponse correcte comme 1 point, sans bonus", () => {
        const answers = [
            buildSoloAnswer(buildQuestion({id: "q1", correctIndex: 0}), 0, 1000),
            buildSoloAnswer(buildQuestion({id: "q2", correctIndex: 0}), 1, 500),
            buildSoloAnswer(buildQuestion({id: "q3", correctIndex: 0}), 0, 14000),
        ];
        expect(computeSoloScore(answers)).toBe(2);
    });

    it("retourne 0 pour une liste de réponses vide", () => {
        expect(computeSoloScore([])).toBe(0);
    });
});

describe("computeAverageResponseMs", () => {
    it("retourne 0 pour une liste de réponses vide", () => {
        expect(computeAverageResponseMs([])).toBe(0);
    });

    it("calcule la moyenne des temps de réponse", () => {
        const answers = [
            buildSoloAnswer(buildQuestion({id: "q1"}), 0, 1000),
            buildSoloAnswer(buildQuestion({id: "q2"}), 0, 3000),
        ];
        expect(computeAverageResponseMs(answers)).toBe(2000);
    });
});

describe("computeLongestCorrectStreak", () => {
    it("retourne 0 quand aucune réponse n'est correcte", () => {
        const answers = [buildSoloAnswer(buildQuestion({correctIndex: 0}), 1, 1000)];
        expect(computeLongestCorrectStreak(answers)).toBe(0);
    });

    it("trouve la plus longue série de bonnes réponses consécutives", () => {
        const q = buildQuestion({correctIndex: 0});
        const answers = [
            buildSoloAnswer(q, 0, 1000),
            buildSoloAnswer(q, 0, 1000),
            buildSoloAnswer(q, 1, 1000),
            buildSoloAnswer(q, 0, 1000),
            buildSoloAnswer(q, 0, 1000),
            buildSoloAnswer(q, 0, 1000),
        ];
        expect(computeLongestCorrectStreak(answers)).toBe(3);
    });
});
