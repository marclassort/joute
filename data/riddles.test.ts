import {isAnswerCorrect} from "@/game/textMatch";
import {ALL_RIDDLES, validateRiddleCorpus} from "./riddles";
import {JOUTE_MAX_QUESTIONS} from "@/game/oneWinnerConfig";

describe("corpus d'énigmes (La Joute)", () => {
    it("est déjà valide au chargement, au moins de quoi jouer une manche complète (10 énigmes)", () => {
        expect(() => validateRiddleCorpus(ALL_RIDDLES)).not.toThrow();
        expect(ALL_RIDDLES.length).toBeGreaterThanOrEqual(JOUTE_MAX_QUESTIONS);
    });

    it("n'a que des identifiants uniques", () => {
        const ids = ALL_RIDDLES.map((riddle) => riddle.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("a exactement 4 indices et 4 propositions non vides par énigme", () => {
        for (const riddle of ALL_RIDDLES) {
            expect(riddle.clues).toHaveLength(4);
            expect(riddle.choices).toHaveLength(4);
            expect(new Set(riddle.choices.map((choice) => choice.trim())).size).toBe(4);
        }
    });

    it("la proposition du filet à correctIndex désigne la même réponse que le clavier", () => {
        for (const riddle of ALL_RIDDLES) {
            const normalizedChoice = riddle.choices[riddle.correctIndex].toLowerCase();
            expect(normalizedChoice).toContain(riddle.answer.toLowerCase());
        }
    });

    it("chaque réponse se reconnaît elle-même via isAnswerCorrect (game/textMatch.ts)", () => {
        for (const riddle of ALL_RIDDLES) {
            expect(isAnswerCorrect(riddle.answer, riddle.answer)).toBe(true);
        }
    });
});
