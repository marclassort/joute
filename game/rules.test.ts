import {Match, Player, Question, Round} from "./types";
import {
    DRAWABLE_CATEGORIES,
    applyExpiration,
    availableCategories,
    computeExpiredOutcome,
    computeMatchStats,
    computeOutcomeForPlayer,
    computeScore,
    computeVerdict,
    drawCategoryOptions,
    isExpired,
    otherPlayerId,
    pickQuestions,
} from "./rules";

const playerOne: Player = {id: "p1", displayName: "Alix", avatarUrl: null, isGhost: false};
const playerTwo: Player = {id: "p2", displayName: "Bo", avatarUrl: null, isGhost: false};

function buildRound(overrides: Partial<Round> = {}): Round {
    return {
        index: 0,
        category: "histoire",
        chosenBy: playerOne.id,
        questionIds: ["q1", "q2", "q3"],
        answers: [],
        ...overrides,
    };
}

function buildMatch(overrides: Partial<Match> = {}): Match {
    const now = Date.now();
    return {
        id: "match-1",
        status: "active",
        players: [playerOne, playerTwo],
        rounds: [],
        currentRoundIndex: 0,
        currentTurnPlayerId: playerOne.id,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 1000,
        invitationCode: null,
        ...overrides,
    };
}

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

describe("computeScore / computeVerdict", () => {
    it("compte uniquement les bonnes réponses du joueur demandé", () => {
        const match = buildMatch({
            rounds: [
                buildRound({
                    answers: [
                        {questionId: "q1", playerId: "p1", selectedIndex: 0, isCorrect: true, elapsedMs: 1000, answeredAt: 1},
                        {questionId: "q2", playerId: "p1", selectedIndex: 1, isCorrect: false, elapsedMs: 1000, answeredAt: 2},
                        {questionId: "q1", playerId: "p2", selectedIndex: 0, isCorrect: true, elapsedMs: 1000, answeredAt: 3},
                    ],
                }),
            ],
        });

        expect(computeScore(match, "p1")).toBe(1);
        expect(computeScore(match, "p2")).toBe(1);
    });

    it("retourne un match nul quand les scores sont égaux", () => {
        const match = buildMatch();
        expect(computeVerdict(match)).toBe("draw");
    });

    it("désigne le joueur avec le meilleur score", () => {
        const match = buildMatch({
            rounds: [
                buildRound({
                    answers: [
                        {questionId: "q1", playerId: "p1", selectedIndex: 0, isCorrect: true, elapsedMs: 1000, answeredAt: 1},
                    ],
                }),
            ],
        });
        expect(computeVerdict(match)).toBe("playerOneWin");
    });
});

describe("availableCategories / drawCategoryOptions", () => {
    it("exclut 'actualite' et les thèmes déjà utilisés", () => {
        const match = buildMatch({rounds: [buildRound({category: "histoire"})]});
        const available = availableCategories(match);

        expect(available).not.toContain("actualite");
        expect(available).not.toContain("histoire");
        expect(available.length).toBe(DRAWABLE_CATEGORIES.length - 1);
    });

    it("tire toujours des thèmes parmi les disponibles", () => {
        const match = buildMatch({rounds: [buildRound({category: "histoire"})]});
        const options = drawCategoryOptions(match, 3, "seed-a");

        for (const category of options) {
            expect(availableCategories(match)).toContain(category);
        }
    });

    it("gère le cas où moins de thèmes que demandé sont disponibles", () => {
        const usedRounds = DRAWABLE_CATEGORIES.slice(0, DRAWABLE_CATEGORIES.length - 2).map((category, index) =>
            buildRound({index, category}),
        );
        const match = buildMatch({rounds: usedRounds});

        const options = drawCategoryOptions(match, 3, "seed-b");

        expect(options.length).toBe(2);
        expect(new Set(options).size).toBe(options.length);
    });

    it("est déterministe pour une même graine", () => {
        const match = buildMatch();
        expect(drawCategoryOptions(match, 3, "même-graine")).toEqual(drawCategoryOptions(match, 3, "même-graine"));
    });
});

describe("pickQuestions", () => {
    const pool: Question[] = [
        buildQuestion({id: "h1", category: "histoire"}),
        buildQuestion({id: "h2", category: "histoire"}),
        buildQuestion({id: "h3", category: "histoire"}),
        buildQuestion({id: "h4", category: "histoire"}),
        buildQuestion({id: "s1", category: "sciences"}),
    ];

    it("ne retourne que des questions du thème demandé", () => {
        const picked = pickQuestions(pool, "histoire", 3, [], "seed-c");
        expect(picked.length).toBe(3);
        for (const id of picked) {
            expect(id.startsWith("h")).toBe(true);
        }
    });

    it("n'inclut jamais les identifiants exclus", () => {
        const picked = pickQuestions(pool, "histoire", 3, ["h1", "h2"], "seed-d");
        expect(picked).not.toContain("h1");
        expect(picked).not.toContain("h2");
    });

    it("est déterministe pour une même graine", () => {
        expect(pickQuestions(pool, "histoire", 3, [], "seed-e")).toEqual(pickQuestions(pool, "histoire", 3, [], "seed-e"));
    });
});

describe("expiration", () => {
    it("n'est pas expirée avant expiresAt", () => {
        const match = buildMatch({expiresAt: Date.now() + 10_000});
        expect(isExpired(match, Date.now())).toBe(false);
        expect(applyExpiration(match, Date.now()).status).toBe("active");
    });

    it("passe en expired une fois expiresAt dépassé, même relue plus tard", () => {
        const match = buildMatch({expiresAt: Date.now() - 1});
        const result = applyExpiration(match, Date.now());
        expect(result.status).toBe("expired");
    });

    it("ne touche pas une partie déjà terminée", () => {
        const match = buildMatch({status: "completed", expiresAt: Date.now() - 1});
        expect(applyExpiration(match, Date.now()).status).toBe("completed");
    });

    it("annule la partie si personne n'a répondu", () => {
        const match = buildMatch();
        expect(computeExpiredOutcome(match)).toEqual({kind: "cancelled"});
    });

    it("fait perdre le joueur dont c'était le tour si des réponses existent", () => {
        const match = buildMatch({
            currentTurnPlayerId: "p2",
            rounds: [
                buildRound({
                    answers: [
                        {questionId: "q1", playerId: "p1", selectedIndex: 0, isCorrect: true, elapsedMs: 1000, answeredAt: 1},
                    ],
                }),
            ],
        });
        expect(computeExpiredOutcome(match)).toEqual({kind: "forfeited", loserId: "p2", winnerId: "p1"});
    });
});

describe("otherPlayerId", () => {
    it("retourne l'autre joueur du match", () => {
        const match = buildMatch();
        expect(otherPlayerId(match, "p1")).toBe("p2");
        expect(otherPlayerId(match, "p2")).toBe("p1");
    });
});

function withAnswer(overrides: Partial<Match> = {}, playerOneCorrect: boolean, playerTwoCorrect: boolean): Match {
    return buildMatch({
        status: "completed",
        rounds: [
            buildRound({
                answers: [
                    {questionId: "q1", playerId: "p1", selectedIndex: 0, isCorrect: playerOneCorrect, elapsedMs: 1, answeredAt: 1},
                    {questionId: "q1", playerId: "p2", selectedIndex: 0, isCorrect: playerTwoCorrect, elapsedMs: 1, answeredAt: 2},
                ],
            }),
        ],
        ...overrides,
    });
}

describe("computeOutcomeForPlayer", () => {
    it("retourne win/loss pour une partie terminée avec un vainqueur", () => {
        const match = withAnswer({}, true, false);
        expect(computeOutcomeForPlayer(match, "p1")).toBe("win");
        expect(computeOutcomeForPlayer(match, "p2")).toBe("loss");
    });

    it("retourne draw pour une partie terminée à égalité", () => {
        const match = withAnswer({}, true, true);
        expect(computeOutcomeForPlayer(match, "p1")).toBe("draw");
        expect(computeOutcomeForPlayer(match, "p2")).toBe("draw");
    });

    it("retourne win/loss pour une partie expirée avec des réponses", () => {
        const match = buildMatch({
            status: "expired",
            currentTurnPlayerId: "p2",
            rounds: [buildRound({answers: [{questionId: "q1", playerId: "p1", selectedIndex: 0, isCorrect: true, elapsedMs: 1, answeredAt: 1}]})],
        });
        expect(computeOutcomeForPlayer(match, "p1")).toBe("win");
        expect(computeOutcomeForPlayer(match, "p2")).toBe("loss");
    });

    it("retourne null pour une partie expirée annulée (personne n'a joué)", () => {
        const match = buildMatch({status: "expired"});
        expect(computeOutcomeForPlayer(match, "p1")).toBeNull();
    });

    it("retourne null pour une partie encore active", () => {
        const match = buildMatch({status: "active"});
        expect(computeOutcomeForPlayer(match, "p1")).toBeNull();
    });
});

describe("computeMatchStats", () => {
    it("compte victoires, défaites et nuls sur les parties terminées uniquement", () => {
        const win = withAnswer({id: "m-win", updatedAt: 3}, true, false);
        const loss = withAnswer({id: "m-loss", updatedAt: 2}, false, true);
        const draw = withAnswer({id: "m-draw", updatedAt: 1}, true, true);
        const stillActive = buildMatch({id: "m-active", status: "active", updatedAt: 4});

        const stats = computeMatchStats([win, loss, draw, stillActive], "p1");
        expect(stats.wins).toBe(1);
        expect(stats.losses).toBe(1);
        expect(stats.draws).toBe(1);
    });

    it("calcule la série en cours comme le nombre de victoires consécutives les plus récentes", () => {
        const winA = withAnswer({id: "m-a", updatedAt: 3}, true, false);
        const winB = withAnswer({id: "m-b", updatedAt: 2}, true, false);
        const loss = withAnswer({id: "m-c", updatedAt: 1}, false, true);

        expect(computeMatchStats([winA, winB, loss], "p1").currentStreak).toBe(2);
    });

    it("remet la série à zéro si la partie la plus récente n'est pas une victoire", () => {
        const win = withAnswer({id: "m-a", updatedAt: 1}, true, false);
        const draw = withAnswer({id: "m-b", updatedAt: 2}, true, true);

        expect(computeMatchStats([win, draw], "p1").currentStreak).toBe(0);
    });

    it("ignore les parties expirées annulées, sans casser la série", () => {
        const win = withAnswer({id: "m-a", updatedAt: 1}, true, false);
        const cancelled = buildMatch({id: "m-b", status: "expired", updatedAt: 2});

        const stats = computeMatchStats([win, cancelled], "p1");
        expect(stats.currentStreak).toBe(1);
        expect(stats.wins).toBe(1);
    });
});
