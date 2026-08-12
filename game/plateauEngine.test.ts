import {PLATEAU_WINNING_SCORE, Player, PlateauMatch, PlateauRound, Question} from "./types";
import {
    availablePlateauCategories,
    canPlayerOpenRound,
    computePlateauActivity,
    computePlateauScore,
    computePlateauStandings,
    createPlateauMatch,
    openPlateauRound,
    submitPlateauAnswer,
} from "./plateauEngine";
import {DRAWABLE_CATEGORIES} from "./rules";

function buildPlayer(id: string): Player {
    return {id, displayName: id, avatarUrl: null, isGhost: false};
}

const players = ["p1", "p2", "p3", "p4"].map(buildPlayer);

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

function newMatch(playerList: Player[] = players): PlateauMatch {
    return createPlateauMatch({id: "plateau-1", players: playerList, now: 0});
}

describe("createPlateauMatch", () => {
    it("démarre une partie active sans manche", () => {
        const match = newMatch();
        expect(match.status).toBe("active");
        expect(match.rounds).toEqual([]);
    });

    it("refuse moins de 4 joueurs", () => {
        expect(() => createPlateauMatch({id: "m", players: players.slice(0, 3)})).toThrow();
    });

    it("refuse plus de 6 joueurs", () => {
        const sevenPlayers = [...players, buildPlayer("p5"), buildPlayer("p6"), buildPlayer("p7")];
        expect(() => createPlateauMatch({id: "m", players: sevenPlayers})).toThrow();
    });

    it("accepte 6 joueurs", () => {
        const sixPlayers = [...players, buildPlayer("p5"), buildPlayer("p6")];
        expect(() => createPlateauMatch({id: "m", players: sixPlayers})).not.toThrow();
    });
});

describe("openPlateauRound", () => {
    it("crée une manche pour le joueur demandé", () => {
        const match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"], now: 42});
        expect(match.rounds).toEqual([
            {index: 0, playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"], answers: [], openedAt: 42},
        ]);
    });

    it("refuse un thème déjà utilisé par n'importe quel joueur du plateau", () => {
        const match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"]});
        expect(() =>
            openPlateauRound({match, playerId: "p2", category: "sciences", questionIds: ["q4", "q5", "q6"]}),
        ).toThrow();
    });

    it("refuse si le joueur a déjà une manche ouverte", () => {
        const match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"]});
        expect(() =>
            openPlateauRound({match, playerId: "p1", category: "histoire", questionIds: ["q4", "q5", "q6"]}),
        ).toThrow();
    });

    it("permet à plusieurs joueurs d'avoir chacun une manche ouverte en parallèle", () => {
        let match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"]});
        match = openPlateauRound({match, playerId: "p2", category: "histoire", questionIds: ["q4", "q5", "q6"]});
        expect(match.rounds.length).toBe(2);
        expect(canPlayerOpenRound(match, "p3")).toBe(true);
    });
});

describe("submitPlateauAnswer", () => {
    function matchWithOpenRound(): PlateauMatch {
        return openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"]});
    }

    it("refuse s'il n'y a pas de manche ouverte pour ce joueur", () => {
        expect(() =>
            submitPlateauAnswer({match: newMatch(), playerId: "p1", question: buildQuestion({id: "q1"}), selectedIndex: 0, elapsedMs: 1}),
        ).toThrow();
    });

    it("calcule isCorrect en comparant à correctIndex", () => {
        const match = submitPlateauAnswer({
            match: matchWithOpenRound(),
            playerId: "p1",
            question: buildQuestion({id: "q1", correctIndex: 2}),
            selectedIndex: 2,
            elapsedMs: 1,
        });
        expect(match.rounds[0].answers[0].isCorrect).toBe(true);
    });

    it("permet de rouvrir une manche une fois la précédente terminée", () => {
        let match = matchWithOpenRound();
        for (const id of ["q1", "q2", "q3"]) {
            match = submitPlateauAnswer({match, playerId: "p1", question: buildQuestion({id}), selectedIndex: 1, elapsedMs: 1});
        }
        expect(canPlayerOpenRound(match, "p1")).toBe(true);
    });

    it("termine la partie dès qu'un joueur atteint PLATEAU_WINNING_SCORE, même en cours de manche", () => {
        const priorRounds: PlateauRound[] = [];
        for (let i = 0; i < 7; i += 1) {
            priorRounds.push({
                index: i,
                playerId: "p1",
                category: DRAWABLE_CATEGORIES[i],
                questionIds: [`r${i}-1`, `r${i}-2`, `r${i}-3`],
                openedAt: i * 3,
                answers: [`r${i}-1`, `r${i}-2`, `r${i}-3`].map((questionId, at) => ({
                    questionId,
                    playerId: "p1",
                    selectedIndex: 0,
                    isCorrect: true,
                    elapsedMs: 1,
                    answeredAt: i * 3 + at,
                })),
            });
        }
        priorRounds.push({
            index: 7,
            playerId: "p1",
            category: DRAWABLE_CATEGORIES[7],
            questionIds: ["r7-1", "r7-2", "r7-3"],
            openedAt: 100,
            answers: [
                {questionId: "r7-1", playerId: "p1", selectedIndex: 0, isCorrect: true, elapsedMs: 1, answeredAt: 100},
                {questionId: "r7-2", playerId: "p1", selectedIndex: 0, isCorrect: true, elapsedMs: 1, answeredAt: 101},
            ],
        });
        const match: PlateauMatch = {...newMatch(), rounds: priorRounds};
        expect(computePlateauScore(match, "p1")).toBe(PLATEAU_WINNING_SCORE - 1);

        const updated = submitPlateauAnswer({
            match,
            playerId: "p1",
            question: buildQuestion({id: "r7-3", category: DRAWABLE_CATEGORIES[7]}),
            selectedIndex: 0,
            elapsedMs: 1,
        });

        expect(computePlateauScore(updated, "p1")).toBe(PLATEAU_WINNING_SCORE);
        expect(updated.status).toBe("completed");
    });
});

describe("computePlateauStandings", () => {
    it("classe les joueurs par score décroissant", () => {
        let match = openPlateauRound({match: newMatch(), playerId: "p2", category: "sciences", questionIds: ["q1", "q2", "q3"]});
        match = submitPlateauAnswer({match, playerId: "p2", question: buildQuestion({id: "q1"}), selectedIndex: 0, elapsedMs: 1});

        const standings = computePlateauStandings(match);
        expect(standings[0].player.id).toBe("p2");
        expect(standings[0].score).toBe(1);
        expect(standings.slice(1).every((entry) => entry.score === 0)).toBe(true);
    });
});

describe("availablePlateauCategories", () => {
    it("redevient disponible une fois tous les thèmes épuisés", () => {
        const rounds: PlateauRound[] = DRAWABLE_CATEGORIES.map((category, index) => ({
            index,
            playerId: "p1",
            category,
            questionIds: [`q${index}-1`, `q${index}-2`, `q${index}-3`],
            answers: [],
            openedAt: index,
        }));
        const match: PlateauMatch = {...newMatch(), rounds};
        expect(availablePlateauCategories(match)).toEqual(DRAWABLE_CATEGORIES);
    });
});

describe("computePlateauActivity", () => {
    it("signale un joueur qui n'a encore jamais joué", () => {
        const match = newMatch();
        const activity = computePlateauActivity(match);
        expect(activity.every((entry) => entry.kind === "not-played-yet")).toBe(true);
        expect(activity.map((entry) => entry.playerId).sort()).toEqual(players.map((p) => p.id).sort());
    });

    it("signale une manche ouverte non terminée", () => {
        const match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"], now: 10});
        const activity = computePlateauActivity(match);
        const entry = activity.find((e) => e.playerId === "p1");
        expect(entry).toEqual({kind: "round-opened", playerId: "p1", category: "sciences", at: 10});
    });

    it("signale une manche terminée avec le score obtenu", () => {
        let match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"], now: 10});
        match = submitPlateauAnswer({match, playerId: "p1", question: buildQuestion({id: "q1", correctIndex: 0}), selectedIndex: 0, elapsedMs: 1, now: 11});
        match = submitPlateauAnswer({match, playerId: "p1", question: buildQuestion({id: "q2", correctIndex: 0}), selectedIndex: 1, elapsedMs: 1, now: 12});
        match = submitPlateauAnswer({match, playerId: "p1", question: buildQuestion({id: "q3", correctIndex: 0}), selectedIndex: 0, elapsedMs: 1, now: 13});

        const activity = computePlateauActivity(match);
        const entry = activity.find((e) => e.playerId === "p1");
        expect(entry).toEqual({kind: "round-completed", playerId: "p1", category: "sciences", correctCount: 2, at: 13});
    });

    it("trie du plus récent au plus ancien", () => {
        let match = openPlateauRound({match: newMatch(), playerId: "p1", category: "sciences", questionIds: ["q1", "q2", "q3"], now: 100});
        match = openPlateauRound({match, playerId: "p2", category: "histoire", questionIds: ["q4", "q5", "q6"], now: 200});

        const activity = computePlateauActivity(match);
        const p1Index = activity.findIndex((e) => e.playerId === "p1" && e.kind === "round-opened");
        const p2Index = activity.findIndex((e) => e.playerId === "p2" && e.kind === "round-opened");
        expect(p2Index).toBeLessThan(p1Index);
    });
});
