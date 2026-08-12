import {Question} from "./types";
import {buildStreakAnswer, computeCurrentStreak, computeHint} from "./streakEngine";

function buildQuestion(overrides: Partial<Question> = {}): Question {
    return {
        id: "q1",
        category: "geographie",
        difficulty: 1,
        statement: "?",
        choices: ["Rhin", "Danube", "Volga", "Seine"],
        correctIndex: 1,
        explanation: "parce que",
        perishable: false,
        ...overrides,
    };
}

describe("buildStreakAnswer", () => {
    it("marque la réponse correcte quand le texte correspond (avec tolérance) au bon choix", () => {
        const answer = buildStreakAnswer(buildQuestion(), "Danub", false, 3000);
        expect(answer).toEqual({questionId: "q1", submittedText: "Danub", isCorrect: true, usedHint: false, elapsedMs: 3000});
    });

    it("marque la réponse incorrecte quand le texte ne correspond pas", () => {
        const answer = buildStreakAnswer(buildQuestion(), "Rhin", true, 5000);
        expect(answer.isCorrect).toBe(false);
        expect(answer.usedHint).toBe(true);
    });
});

describe("computeCurrentStreak", () => {
    it("vaut 0 sans réponse", () => {
        expect(computeCurrentStreak([])).toBe(0);
    });

    it("compte les bonnes réponses tant qu'aucune n'est fausse", () => {
        const answers = [
            buildStreakAnswer(buildQuestion({id: "q1"}), "Danube", false, 1),
            buildStreakAnswer(buildQuestion({id: "q2"}), "Danube", false, 1),
        ];
        expect(computeCurrentStreak(answers)).toBe(2);
    });

    it("s'arrête à la première réponse fausse", () => {
        const answers = [
            buildStreakAnswer(buildQuestion({id: "q1"}), "Danube", false, 1),
            buildStreakAnswer(buildQuestion({id: "q2"}), "Rhin", false, 1),
            buildStreakAnswer(buildQuestion({id: "q3"}), "Danube", false, 1),
        ];
        expect(computeCurrentStreak(answers)).toBe(1);
    });
});

describe("computeHint", () => {
    it("retourne la première lettre de la bonne réponse, en majuscule", () => {
        expect(computeHint(buildQuestion())).toBe("D");
    });
});
