import {nextEpreuveKind, pickEpreuveQuestions} from "./oneWinnerQuestionPicker";
import {Question} from "./types";

function makeQuestion(id: string): Question {
    return {
        id,
        category: "histoire",
        difficulty: 1,
        statement: id,
        choices: ["a", "b", "c", "d"],
        correctIndex: 0,
        explanation: "",
        perishable: false,
    };
}

describe("nextEpreuveKind", () => {
    it("enchaîne les épreuves de l'étape main", () => {
        expect(nextEpreuveKind("main", 0)).toBe("defi");
        expect(nextEpreuveKind("main", 1)).toBe("buzzer");
        expect(nextEpreuveKind("main", 2)).toBe("conquete");
    });

    it("retourne null une fois l'étape complète", () => {
        expect(nextEpreuveKind("main", 3)).toBeNull();
        expect(nextEpreuveKind("final", 1)).toBeNull();
    });
});

describe("pickEpreuveQuestions", () => {
    const pool = Array.from({length: 20}, (_, i) => makeQuestion(`q${i}`));

    it("pioche le bon nombre de questions pour le défi", () => {
        expect(pickEpreuveQuestions(pool, "defi", [])).toHaveLength(5);
    });

    it("pioche le bon nombre de questions pour le buzzer", () => {
        expect(pickEpreuveQuestions(pool, "buzzer", [])).toHaveLength(8);
    });

    it("exclut les questions déjà utilisées", () => {
        const excludeIds = pool.slice(0, 17).map((q) => q.id);
        const picked = pickEpreuveQuestions(pool, "conquete", excludeIds);
        expect(picked.every((id) => !excludeIds.includes(id))).toBe(true);
    });
});
