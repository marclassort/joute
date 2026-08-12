import {Category, Match, Player, Question, Round, WINNING_SCORE} from "./types";
import {availableCategories, computeScore} from "./rules";
import {chooseCategory, createMatch, joinMatch, resolveTurn, submitAnswer} from "./engine";

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

    it("peut démarrer en pending pour une invitation dont le deuxième joueur n'a pas encore rejoint", () => {
        const placeholder: Player = {id: "code-abc", displayName: "En attente…", avatarUrl: null, isGhost: false};
        const match = createMatch({id: "match-1", players: [playerOne, placeholder], status: "pending", now: 0});
        expect(match.status).toBe("pending");
    });
});

describe("joinMatch", () => {
    function pendingMatch(): Match {
        const placeholder: Player = {id: "code-abc", displayName: "En attente…", avatarUrl: null, isGhost: false};
        return createMatch({id: "match-1", players: [playerOne, placeholder], status: "pending", now: 0});
    }

    it("remplace le second joueur et active la partie", () => {
        const joined = joinMatch({match: pendingMatch(), player: playerTwo, now: 1000});
        expect(joined.status).toBe("active");
        expect(joined.players[1]).toEqual(playerTwo);
        expect(joined.players[0]).toEqual(playerOne);
    });

    it("refuse si la partie n'est pas pending", () => {
        expect(() => joinMatch({match: newMatch(), player: playerTwo})).toThrow();
    });

    it("refuse que le créateur rejoigne sa propre invitation", () => {
        expect(() => joinMatch({match: pendingMatch(), player: playerOne})).toThrow();
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

// Soumet les réponses une à une et s'arrête dès que la partie n'est plus active :
// sous la règle de course à WINNING_SCORE, une victoire peut survenir au milieu d'une manche.
function submitCorrectAnswers(match: Match, playerId: string, questionIds: readonly string[], category: Category): Match {
    let next = match;
    for (const questionId of questionIds) {
        if (next.status !== "active") break;
        next = submitAnswer({match: next, playerId, question: buildQuestion({id: questionId, category}), selectedIndex: 0, elapsedMs: 5000});
    }
    return next;
}

function playRound(match: Match, chooserId: string, category: Category): Match {
    const roundIndex = match.currentRoundIndex;
    const questionIds: [string, string, string] = [`q-${roundIndex}-1`, `q-${roundIndex}-2`, `q-${roundIndex}-3`];

    let next = chooseCategory({match, playerId: chooserId, category, questionIds});
    next = submitCorrectAnswers(next, chooserId, questionIds, category);
    return next.status === "active" ? resolveTurn(next) : next;
}

function catchUpRound(match: Match, playerId: string): Match {
    const round = match.rounds[match.currentRoundIndex];
    const next = submitCorrectAnswers(match, playerId, round.questionIds, round.category);
    return next.status === "active" ? resolveTurn(next) : next;
}

describe("partie complète (course à WINNING_SCORE)", () => {
    it("alterne les tours jusqu'à ce qu'un joueur atteigne WINNING_SCORE, sans jouer de manches inutiles", () => {
        let match = newMatch();
        let iterations = 0;

        while (match.status === "active" && iterations < 50) {
            iterations += 1;
            const player = match.currentTurnPlayerId;

            if (match.rounds[match.currentRoundIndex]) {
                match = catchUpRound(match, player);
            }

            if (match.status === "active" && match.rounds.length === match.currentRoundIndex) {
                const category = availableCategories(match)[0];
                match = playRound(match, match.currentTurnPlayerId, category);
            }
        }

        expect(match.status).toBe("completed");
        const scoreOne = computeScore(match, playerOne.id);
        const scoreTwo = computeScore(match, playerTwo.id);
        expect(Math.max(scoreOne, scoreTwo)).toBe(WINNING_SCORE);
        expect(Math.min(scoreOne, scoreTwo)).toBeLessThan(WINNING_SCORE);
    });
});

describe("submitAnswer — victoire immédiate à WINNING_SCORE", () => {
    it("termine la partie dès la réponse qui fait atteindre WINNING_SCORE, sans attendre la fin de la manche ni resolveTurn", () => {
        function correctAnswer(questionId: string, at: number) {
            return {questionId, playerId: playerOne.id, selectedIndex: 0, isCorrect: true, elapsedMs: 1, answeredAt: at};
        }

        const priorRounds: Round[] = [
            {index: 0, category: "sciences", chosenBy: playerOne.id, questionIds: ["q1", "q2", "q3"], answers: [
                correctAnswer("q1", 1), correctAnswer("q2", 2), correctAnswer("q3", 3),
            ]},
            {index: 1, category: "histoire", chosenBy: playerOne.id, questionIds: ["q4", "q5", "q6"], answers: [
                correctAnswer("q4", 4), correctAnswer("q5", 5), correctAnswer("q6", 6),
            ]},
            {index: 2, category: "geographie", chosenBy: playerOne.id, questionIds: ["q7", "q8", "q9"], answers: [
                correctAnswer("q7", 7), correctAnswer("q8", 8),
            ]},
        ];
        const match: Match = {...newMatch(), rounds: priorRounds, currentRoundIndex: 2, currentTurnPlayerId: playerOne.id};
        expect(computeScore(match, playerOne.id)).toBe(WINNING_SCORE - 1);

        const updated = submitAnswer({
            match,
            playerId: playerOne.id,
            question: buildQuestion({id: "q9", category: "geographie"}),
            selectedIndex: 0,
            elapsedMs: 1,
        });

        expect(computeScore(updated, playerOne.id)).toBe(WINNING_SCORE);
        expect(updated.status).toBe("completed");
    });

    it("ne termine pas la partie tant que WINNING_SCORE n'est pas atteint", () => {
        const match = chooseCategory({match: newMatch(), playerId: playerOne.id, category: "sciences", questionIds: ["q1", "q2", "q3"]});
        const updated = submitAnswer({match, playerId: playerOne.id, question: buildQuestion({id: "q1"}), selectedIndex: 0, elapsedMs: 1});
        expect(updated.status).toBe("active");
    });
});
