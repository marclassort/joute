import {isAnswerCorrect} from "@/game/textMatch";
import {ALL_OPEN_QUESTIONS, OPEN_QUESTION_THEMES, validateOpenQuestionCorpus} from "./index";

describe("corpus de questions à réponse libre (La Charge)", () => {
    it("est déjà valide au chargement, au moins 3 thèmes de 10 questions ou plus", () => {
        expect(() => validateOpenQuestionCorpus(ALL_OPEN_QUESTIONS)).not.toThrow();
        expect(OPEN_QUESTION_THEMES.length).toBeGreaterThanOrEqual(3);
        for (const theme of OPEN_QUESTION_THEMES) {
            expect(ALL_OPEN_QUESTIONS.filter((q) => q.theme === theme).length).toBeGreaterThanOrEqual(10);
        }
    });

    it("n'a que des identifiants uniques", () => {
        const ids = ALL_OPEN_QUESTIONS.map((question) => question.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("rejette un corpus contenant un identifiant dupliqué", () => {
        expect(() => validateOpenQuestionCorpus([ALL_OPEN_QUESTIONS[0], ALL_OPEN_QUESTIONS[0]])).toThrow();
    });

    it("chaque réponse se reconnaît elle-même via isAnswerCorrect (game/textMatch.ts)", () => {
        for (const question of ALL_OPEN_QUESTIONS) {
            expect(isAnswerCorrect(question.answer, question.answer)).toBe(true);
            for (const alt of question.acceptableAnswers ?? []) {
                expect(isAnswerCorrect(alt, question.answer) || isAnswerCorrect(alt, alt)).toBe(true);
            }
        }
    });
});
