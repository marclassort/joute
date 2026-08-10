import {pickQuestions} from "@/game/rules";
import {ALL_QUESTIONS, validateCorpus} from "./index";

describe("corpus de questions", () => {
    it("est déjà valide au chargement (45 questions, 3 par thème minimum)", () => {
        expect(() => validateCorpus(ALL_QUESTIONS)).not.toThrow();
        expect(ALL_QUESTIONS.length).toBeGreaterThanOrEqual(45);
    });

    it("n'a que des identifiants uniques", () => {
        const ids = ALL_QUESTIONS.map((question) => question.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("a un correctIndex entre 0 et 3 pour toutes les questions", () => {
        for (const question of ALL_QUESTIONS) {
            expect(question.correctIndex).toBeGreaterThanOrEqual(0);
            expect(question.correctIndex).toBeLessThanOrEqual(3);
        }
    });

    it("a exactement 4 propositions non vides et distinctes par question", () => {
        for (const question of ALL_QUESTIONS) {
            expect(question.choices.length).toBe(4);
            expect(new Set(question.choices.map((choice) => choice.trim())).size).toBe(4);
            for (const choice of question.choices) {
                expect(choice.trim().length).toBeGreaterThan(0);
            }
        }
    });

    it("a une explication non vide pour toutes les questions", () => {
        for (const question of ALL_QUESTIONS) {
            expect(question.explanation.trim().length).toBeGreaterThan(0);
        }
    });

    it("réserve perishable/source/validUntil exclusivement à la catégorie actualite", () => {
        for (const question of ALL_QUESTIONS) {
            if (question.category === "actualite") {
                expect(question.perishable).toBe(true);
                expect(question.source).toBeTruthy();
                expect(question.validUntil).toBeTruthy();
            } else {
                expect(question.perishable).toBe(false);
                expect(question.validUntil).toBeUndefined();
            }
        }
    });

    it("rejette un corpus contenant un identifiant dupliqué", () => {
        const duplicated = [ALL_QUESTIONS[0], ALL_QUESTIONS[0]];
        expect(() => validateCorpus(duplicated)).toThrow();
    });

    it("ne sert jamais une question actualite déjà périmée", () => {
        const actualiteQuestions = ALL_QUESTIONS.filter((question) => question.category === "actualite");
        const farFuture = new Date("2030-01-01T00:00:00.000Z").getTime();

        const picked = pickQuestions(actualiteQuestions, "actualite", actualiteQuestions.length, [], "seed-actu", farFuture);

        expect(picked.length).toBe(0);
    });

    it("continue de servir une question actualite tant qu'elle n'est pas périmée", () => {
        const actualiteQuestions = ALL_QUESTIONS.filter((question) => question.category === "actualite");
        const now = Date.now();

        const picked = pickQuestions(actualiteQuestions, "actualite", actualiteQuestions.length, [], "seed-actu", now);

        expect(picked.length).toBe(actualiteQuestions.length);
    });
});
