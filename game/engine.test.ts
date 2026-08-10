import {Category, Match, Player, Question} from "./types";
import {availableCategories} from "./rules";
import {chooseCategory, createMatch, resolveTurn, submitAnswer} from "./engine";

const playerOne: Player = {id: "p1", displayName: "Alix", avatarUrl: null, isGhost: false};
const playerTwo: Player = {id: "p2", displayName: "Bo", avatarUrl: null, isGhost: false};

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

function newMatch(): Match {
    return createMatch({id: "match-1", players: [playerOne, playerTwo], now: 0});
}

describe("createMatch", () => {
    it("démarre une partie active, tour du premier joueur, sans manche", () => {
        const match = newMatch();
        expect(match.status).toBe("active");
        expect(match.currentRoundIndex).toBe(0);
        expect(match.currentTurnPlayerId).toBe(playerOne.id);
        expect(match.rounds).toEqual([]);
        expect(match.expiresAt).toBe(48 * 60 * 60 * 1000);
    });
});

describe("chooseCategory", () => {
    it("refuse si ce n'est pas le tour du joueur", () => {
        const match = newMatch();
        expect(() =>
            chooseCategory({match, playerId: playerTwo.id, category: "histoire", questionIds: ["q1", "q2", "q3"]}),
        ).toThrow();
    });

    it("refuse un thème déjà utilisé dans la partie", () => {
        const match = chooseCategory({
            match: newMatch(),
            playerId: playerOne.id,
            category: "histoire",
            questionIds: ["q1", "q2", "q3"],
        });
        const withSecondRound = resolveTurn(
            submitAnswer({
                match: submitAnswer({
                    match: submitAnswer({match, playerId: playerOne.id, question: buildQuestion({id: "q1"}), selectedIndex: 0, elapsedMs: 1}),
                    playerId: playerOne.id,
                    question: buildQuestion({id: "q2"}),
                    selectedIndex: 0,
                    elapsedMs: 1,
                }),
                playerId: playerOne.id,
                question: buildQuestion({id: "q3"}),
                selectedIndex: 0,
                elapsedMs: 1,
            }),
        );

        expect(() =>
            chooseCategory({
                match: withSecondRound,
                playerId: playerTwo.id,
                category: "histoire",
                questionIds: ["q4", "q5", "q6"],
            }),
        ).toThrow();
    });

    it("crée la manche avec les questions fournies", () => {
        const match = chooseCategory({
            match: newMatch(),
            playerId: playerOne.id,
            category: "sciences",
            questionIds: ["q1", "q2", "q3"],
        });
        expect(match.rounds).toEqual([
            {index: 0, category: "sciences", chosenBy: playerOne.id, questionIds: ["q1", "q2", "q3"], answers: []},
        ]);
    });
});

describe("submitAnswer", () => {
    function matchWithOpenRound(): Match {
        return chooseCategory({
            match: newMatch(),
            playerId: playerOne.id,
            category: "sciences",
            questionIds: ["q1", "q2", "q3"],
        });
    }

    it("refuse si ce n'est pas le tour du joueur", () => {
        expect(() =>
            submitAnswer({
                match: matchWithOpenRound(),
                playerId: playerTwo.id,
                question: buildQuestion({id: "q1"}),
                selectedIndex: 0,
                elapsedMs: 1,
            }),
        ).toThrow();
    });

    it("refuse une question hors de la manche en cours", () => {
        expect(() =>
            submitAnswer({
                match: matchWithOpenRound(),
                playerId: playerOne.id,
                question: buildQuestion({id: "hors-manche"}),
                selectedIndex: 0,
                elapsedMs: 1,
            }),
        ).toThrow();
    });

    it("refuse de répondre deux fois à la même question", () => {
        const match = submitAnswer({
            match: matchWithOpenRound(),
            playerId: playerOne.id,
            question: buildQuestion({id: "q1"}),
            selectedIndex: 0,
            elapsedMs: 1,
        });

        expect(() =>
            submitAnswer({match, playerId: playerOne.id, question: buildQuestion({id: "q1"}), selectedIndex: 1, elapsedMs: 1}),
        ).toThrow();
    });

    it("marque une réponse expirée (selectedIndex null) comme fausse", () => {
        const match = submitAnswer({
            match: matchWithOpenRound(),
            playerId: playerOne.id,
            question: buildQuestion({id: "q1", correctIndex: 2}),
            selectedIndex: null,
            elapsedMs: 15_000,
        });
        expect(match.rounds[0].answers[0].isCorrect).toBe(false);
        expect(match.rounds[0].answers[0].selectedIndex).toBeNull();
    });

    it("calcule isCorrect en comparant à correctIndex", () => {
        const match = submitAnswer({
            match: matchWithOpenRound(),
            playerId: playerOne.id,
            question: buildQuestion({id: "q1", correctIndex: 2}),
            selectedIndex: 2,
            elapsedMs: 1,
        });
        expect(match.rounds[0].answers[0].isCorrect).toBe(true);
    });
});

describe("resolveTurn", () => {
    it("ne change rien tant que le joueur actif n'a pas fini ses 3 réponses", () => {
        const opened = chooseCategory({
            match: newMatch(),
            playerId: playerOne.id,
            category: "sciences",
            questionIds: ["q1", "q2", "q3"],
        });
        const oneAnswer = submitAnswer({match: opened, playerId: playerOne.id, question: buildQuestion({id: "q1"}), selectedIndex: 0, elapsedMs: 1});
        expect(resolveTurn(oneAnswer)).toBe(oneAnswer);
    });

    it("passe la main à l'autre joueur une fois la manche ouverte et jouée par l'ouvreur", () => {
        let match = chooseCategory({
            match: newMatch(),
            playerId: playerOne.id,
            category: "sciences",
            questionIds: ["q1", "q2", "q3"],
        });
        for (const id of ["q1", "q2", "q3"]) {
            match = submitAnswer({match, playerId: playerOne.id, question: buildQuestion({id}), selectedIndex: 0, elapsedMs: 1});
        }
        const resolved = resolveTurn(match);
        expect(resolved.currentTurnPlayerId).toBe(playerTwo.id);
        expect(resolved.currentRoundIndex).toBe(0);
    });

    it("avance l'index de manche sans changer de joueur quand celui qui rattrape termine une manche non finale", () => {
        let match = chooseCategory({
            match: newMatch(),
            playerId: playerOne.id,
            category: "sciences",
            questionIds: ["q1", "q2", "q3"],
        });
        for (const id of ["q1", "q2", "q3"]) {
            match = submitAnswer({match, playerId: playerOne.id, question: buildQuestion({id}), selectedIndex: 0, elapsedMs: 1});
        }
        match = resolveTurn(match);
        for (const id of ["q1", "q2", "q3"]) {
            match = submitAnswer({match, playerId: playerTwo.id, question: buildQuestion({id}), selectedIndex: 0, elapsedMs: 1});
        }
        const resolved = resolveTurn(match);
        expect(resolved.currentTurnPlayerId).toBe(playerTwo.id);
        expect(resolved.currentRoundIndex).toBe(1);
        expect(resolved.status).toBe("active");
    });
});

function playRound(match: Match, chooserId: string, category: Category): Match {
    const roundIndex = match.currentRoundIndex;
    const questionIds: [string, string, string] = [`q-${roundIndex}-1`, `q-${roundIndex}-2`, `q-${roundIndex}-3`];

    let next = chooseCategory({match, playerId: chooserId, category, questionIds});
    for (const questionId of questionIds) {
        next = submitAnswer({
            match: next,
            playerId: chooserId,
            question: buildQuestion({id: questionId, category}),
            selectedIndex: 0,
            elapsedMs: 5000,
        });
    }
    return resolveTurn(next);
}

function catchUpRound(match: Match, playerId: string): Match {
    const round = match.rounds[match.currentRoundIndex];
    let next = match;
    for (const questionId of round.questionIds) {
        next = submitAnswer({
            match: next,
            playerId,
            question: buildQuestion({id: questionId, category: round.category}),
            selectedIndex: 0,
            elapsedMs: 5000,
        });
    }
    return resolveTurn(next);
}

describe("partie complète (9 tours)", () => {
    it("alterne les tours comme prévu, sans rejouer un thème, jusqu'à complétion", () => {
        let match = newMatch();
        const usedCategories = new Set<Category>();
        let tourCount = 0;

        while (match.status === "active") {
            tourCount += 1;
            const expectedPlayer = tourCount % 2 === 1 ? playerOne.id : playerTwo.id;
            expect(match.currentTurnPlayerId).toBe(expectedPlayer);

            if (match.rounds[match.currentRoundIndex]) {
                match = catchUpRound(match, match.currentTurnPlayerId);
            }

            if (match.status === "active" && match.rounds.length === match.currentRoundIndex) {
                const category = availableCategories(match)[0];
                expect(usedCategories.has(category)).toBe(false);
                usedCategories.add(category);
                match = playRound(match, match.currentTurnPlayerId, category);
            }
        }

        expect(tourCount).toBe(9);
        expect(match.status).toBe("completed");
        expect(match.rounds.length).toBe(8);
        for (const round of match.rounds) {
            expect(round.answers.length).toBe(6);
        }
    });
});
