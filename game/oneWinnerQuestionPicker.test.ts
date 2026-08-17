import {pickJouteQuestions, pickMeleeQuestions, pickNextChargeQuestion} from "./oneWinnerQuestionPicker";
import {JOUTE_MAX_QUESTIONS, MELEE_QUESTION_COUNT} from "./oneWinnerConfig";
import {OpenQuestion, Question, RiddleQuestion} from "./types";

function makeQuestion(id: string): Question {
    return {id, category: "histoire", difficulty: 1, statement: id, choices: ["a", "b", "c", "d"], correctIndex: 0, explanation: "", perishable: false};
}

function makeRiddle(id: string): RiddleQuestion {
    return {id, clues: ["a", "b", "c", "d"], answer: "x", choices: ["a", "b", "c", "d"], correctIndex: 0};
}

function makeOpenQuestion(id: string, theme: string): OpenQuestion {
    return {id, theme, statement: id, answer: "x"};
}

describe("pickMeleeQuestions", () => {
    const pool = Array.from({length: 20}, (_, i) => makeQuestion(`q${i}`));

    it("pioche le bon nombre de questions", () => {
        expect(pickMeleeQuestions(pool)).toHaveLength(MELEE_QUESTION_COUNT);
    });

    it("exclut les questions déjà utilisées", () => {
        const excludeIds = pool.slice(0, 17).map((q) => q.id);
        const picked = pickMeleeQuestions(pool, excludeIds);
        expect(picked.every((id) => !excludeIds.includes(id))).toBe(true);
    });
});

describe("pickJouteQuestions", () => {
    const pool = Array.from({length: 25}, (_, i) => makeRiddle(`r${i}`));

    it("pioche jusqu'à 10 énigmes", () => {
        expect(pickJouteQuestions(pool)).toHaveLength(JOUTE_MAX_QUESTIONS);
    });

    it("n'excède pas le pool disponible", () => {
        expect(pickJouteQuestions(pool.slice(0, 4))).toHaveLength(4);
    });

    it("exclut les énigmes déjà utilisées", () => {
        const excludeIds = pool.slice(0, 20).map((r) => r.id);
        const picked = pickJouteQuestions(pool, excludeIds);
        expect(picked.every((id) => !excludeIds.includes(id))).toBe(true);
    });
});

describe("pickNextChargeQuestion", () => {
    const pool = [
        ...Array.from({length: 5}, (_, i) => makeOpenQuestion(`bot-${i}`, "botanique")),
        ...Array.from({length: 5}, (_, i) => makeOpenQuestion(`disco-${i}`, "disco")),
    ];

    it("ne pioche que dans le thème choisi", () => {
        const picked = pickNextChargeQuestion(pool, "botanique", []);
        expect(picked?.theme).toBe("botanique");
    });

    it("exclut les questions déjà répondues par ce joueur", () => {
        const excludeIds = ["bot-0", "bot-1", "bot-2", "bot-3"];
        const picked = pickNextChargeQuestion(pool, "botanique", excludeIds);
        expect(picked?.id).toBe("bot-4");
    });

    it("retourne null quand le pool du thème est épuisé", () => {
        const excludeIds = ["bot-0", "bot-1", "bot-2", "bot-3", "bot-4"];
        expect(pickNextChargeQuestion(pool, "botanique", excludeIds)).toBeNull();
    });
});
