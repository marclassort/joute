import {
    advanceStage,
    applyDisconnectForfeits,
    applyElimination,
    computeOneWinnerStandings,
    createOneWinnerMatch,
    currentBuzzHolder,
    endCurrentEpreuve,
    recordBuzz,
    setPlayerConnection,
    startMatch,
    startNextEpreuve,
    submitOneWinnerAnswer,
} from "./oneWinnerEngine";
import {RECONNECT_GRACE_MS, stageRulesFor} from "./oneWinnerConfig";
import {OneWinnerMatch} from "./oneWinnerTypes";
import {Player, Question} from "./types";

function makePlayers(count: number): Player[] {
    return Array.from({length: count}, (_, i) => ({
        id: `p${i + 1}`,
        displayName: `Joueur ${i + 1}`,
        avatarUrl: null,
        isGhost: false,
    }));
}

function makeQuestion(id: string, correctIndex = 0): Question {
    return {
        id,
        category: "histoire",
        difficulty: 1,
        statement: `Question ${id}`,
        choices: ["a", "b", "c", "d"],
        correctIndex,
        explanation: "",
        perishable: false,
    };
}

describe("createOneWinnerMatch", () => {
    it("refuse moins de 4 joueurs", () => {
        expect(() => createOneWinnerMatch({id: "m1", players: makePlayers(3)})).toThrow();
    });

    it("refuse plus de 6 joueurs", () => {
        expect(() => createOneWinnerMatch({id: "m1", players: makePlayers(7)})).toThrow();
    });

    it("crée une partie en lobby avec 4 à 6 joueurs", () => {
        const match = createOneWinnerMatch({id: "m1", players: makePlayers(6)});
        expect(match.phase).toBe("lobby");
        expect(match.stageId).toBe("main");
        expect(match.players).toHaveLength(6);
    });
});

describe("cycle de vie d'une étape", () => {
    it("enchaîne intro -> defi -> buzzer -> conquete -> classement", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        expect(match.phase).toBe("intro");

        match = startNextEpreuve({match, questionIds: ["q1"]});
        expect(match.epreuves[0].kind).toBe("defi");
        match = endCurrentEpreuve(match);
        expect(match.phase).toBe("epreuve");

        match = startNextEpreuve({match, questionIds: ["q2"]});
        expect(match.epreuves[1].kind).toBe("buzzer");
        match = endCurrentEpreuve(match);

        match = startNextEpreuve({match, questionIds: ["q3"]});
        expect(match.epreuves[2].kind).toBe("conquete");
        match = endCurrentEpreuve(match);
        expect(match.phase).toBe("classement");
    });

    it("refuse de démarrer une épreuve tant que la précédente n'est pas terminée", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        expect(() => startNextEpreuve({match, questionIds: ["q2"]})).toThrow();
    });
});

describe("Le Défi : score dégressif selon la vitesse", () => {
    it("attribue plus de points à une réponse rapide et correcte", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});

        const question = makeQuestion("q1", 0);
        match = submitOneWinnerAnswer({match, playerId: "p1", question, selectedIndex: 0, elapsedMs: 1_000});
        match = submitOneWinnerAnswer({match, playerId: "p2", question, selectedIndex: 0, elapsedMs: 9_000});
        match = submitOneWinnerAnswer({match, playerId: "p3", question, selectedIndex: 1, elapsedMs: 1_000});

        const standings = computeOneWinnerStandings(match);
        const score = (playerId: string) => standings.find((s) => s.playerId === playerId)?.score ?? 0;
        expect(score("p1")).toBeGreaterThan(score("p2"));
        expect(score("p2")).toBeGreaterThan(score("p3"));
        expect(score("p3")).toBe(0);
    });
});

describe("Le Buzzer : l'ordre serveur fait foi, jamais le timestamp client", () => {
    it("donne la main au premier arrivé côté serveur même si le client prétend le contraire", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q2"]});

        // p2 buzz réellement en premier (now=100) mais prétend avoir buzzé à l'instant 0 côté client.
        match = recordBuzz({match, playerId: "p2", questionId: "q2", clientReportedAt: 0, now: 100});
        match = recordBuzz({match, playerId: "p1", questionId: "q2", clientReportedAt: 999_999, now: 200});

        expect(currentBuzzHolder(match)).toBe("p2");
    });

    it("passe la main au suivant après une mauvaise réponse, avec pénalité", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q2"]});

        match = recordBuzz({match, playerId: "p1", questionId: "q2", now: 100});
        match = recordBuzz({match, playerId: "p2", questionId: "q2", now: 200});

        const question = makeQuestion("q2", 0);
        match = submitOneWinnerAnswer({match, playerId: "p1", question, selectedIndex: 1, elapsedMs: 500, now: 300});
        expect(currentBuzzHolder(match)).toBe("p2");

        match = submitOneWinnerAnswer({match, playerId: "p2", question, selectedIndex: 0, elapsedMs: 500, now: 400});
        const standings = computeOneWinnerStandings(match);
        expect(standings.find((s) => s.playerId === "p1")?.score).toBeLessThan(0);
        expect(standings.find((s) => s.playerId === "p2")?.score).toBeGreaterThan(0);
    });

    it("refuse une réponse d'un joueur qui n'a pas la main", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q2"]});
        match = recordBuzz({match, playerId: "p1", questionId: "q2", now: 100});

        expect(() =>
            submitOneWinnerAnswer({match, playerId: "p2", question: makeQuestion("q2"), selectedIndex: 0, elapsedMs: 100}),
        ).toThrow();
    });
});

describe("ordre des questions : impossible de sauter une question non répondue", () => {
    it("refuse de buzzer sur une question plus loin dans la liste tant que la précédente n'est pas résolue", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q2a", "q2b"]});

        expect(() => recordBuzz({match, playerId: "p1", questionId: "q2b"})).toThrow();
        // La question courante reste jouable normalement.
        expect(() => recordBuzz({match, playerId: "p1", questionId: "q2a"})).not.toThrow();
    });

    it("la question suivante devient jouable une fois la précédente correctement répondue", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q2a", "q2b"]});

        match = recordBuzz({match, playerId: "p1", questionId: "q2a", now: 100});
        match = submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q2a", 0), selectedIndex: 0, elapsedMs: 500});

        expect(() => recordBuzz({match, playerId: "p1", questionId: "q2b"})).not.toThrow();
    });

    it("un joueur ne peut pas sauter une question du Défi avant d'avoir répondu à la précédente", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1a", "q1b"]});

        expect(() =>
            submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q1b", 0), selectedIndex: 0, elapsedMs: 500}),
        ).toThrow();

        match = submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q1a", 0), selectedIndex: 0, elapsedMs: 500});
        expect(() =>
            submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q1b", 0), selectedIndex: 0, elapsedMs: 500}),
        ).not.toThrow();
    });

    it("chaque joueur avance à son propre rythme au Défi, sans attendre les autres", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1a", "q1b"]});

        // p1 répond aux deux questions sans que p2 n'ait encore répondu à la première.
        match = submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q1a", 0), selectedIndex: 0, elapsedMs: 500});
        expect(() =>
            submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q1b", 0), selectedIndex: 0, elapsedMs: 500}),
        ).not.toThrow();
        expect(() =>
            submitOneWinnerAnswer({match, playerId: "p2", question: makeQuestion("q1a", 0), selectedIndex: 0, elapsedMs: 500}),
        ).not.toThrow();
    });
});

describe("La Conquête : risque/récompense", () => {
    it("exige une mise et l'applique en positif ou négatif selon la réponse", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startNextEpreuve({match, questionIds: ["q1"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q2"]});
        match = endCurrentEpreuve(match);
        match = startNextEpreuve({match, questionIds: ["q3"]});

        expect(() =>
            submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q3"), selectedIndex: 0, elapsedMs: 100}),
        ).toThrow();

        match = submitOneWinnerAnswer({match, playerId: "p1", question: makeQuestion("q3", 0), selectedIndex: 0, elapsedMs: 100, wager: 40});
        match = submitOneWinnerAnswer({match, playerId: "p2", question: makeQuestion("q3", 0), selectedIndex: 1, elapsedMs: 100, wager: 40});

        const standings = computeOneWinnerStandings(match);
        expect(standings.find((s) => s.playerId === "p1")?.score).toBe(40);
        expect(standings.find((s) => s.playerId === "p2")?.score).toBe(-40);
    });
});

function playFullStage(match: OneWinnerMatch, correctPlayerIds: readonly string[]): OneWinnerMatch {
    for (const kind of stageRulesFor(match.stageId).epreuves) {
        match = startNextEpreuve({match, questionIds: [`q-${kind}-${match.stageId}`]});
        const question = makeQuestion(`q-${kind}-${match.stageId}`, 0);

        if (kind === "buzzer") {
            correctPlayerIds.forEach((playerId, i) => match = recordBuzz({match, playerId, questionId: question.id, now: i}));
            match = submitOneWinnerAnswer({match, playerId: correctPlayerIds[0], question, selectedIndex: 0, elapsedMs: 500});
        } else {
            for (const entry of match.players.filter((p) => !p.isEliminated)) {
                const isWinner = correctPlayerIds.includes(entry.player.id);
                match = submitOneWinnerAnswer({
                    match,
                    playerId: entry.player.id,
                    question,
                    selectedIndex: isWinner ? 0 : 1,
                    elapsedMs: isWinner ? 1_000 : 1_000,
                    wager: kind === "conquete" ? 50 : null,
                });
            }
        }
        match = endCurrentEpreuve(match);
    }
    match = applyElimination(match);
    return advanceStage(match);
}

describe("parcours complet jusqu'au vainqueur", () => {
    it("élimine progressivement jusqu'à un seul gagnant sur 4 joueurs", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);

        match = playFullStage(match, ["p1", "p2", "p3"]);
        expect(match.stageId).toBe("semifinal");
        expect(match.players.filter((p) => !p.isEliminated)).toHaveLength(3);

        match = playFullStage(match, ["p1", "p2"]);
        expect(match.stageId).toBe("final");
        expect(match.players.filter((p) => !p.isEliminated)).toHaveLength(2);

        match = playFullStage(match, ["p1"]);
        expect(match.phase).toBe("termine");
        expect(match.status).toBe("completed");
        expect(match.winnerId).toBe("p1");
        expect(match.players.find((p) => p.player.id === "p1")?.finalRank).toBe(1);
    });
});

describe("déconnexion", () => {
    it("élimine par forfait après la fenêtre de reconnexion, pas avant", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = setPlayerConnection({match, playerId: "p1", isConnected: false, now: 0});

        let checked = applyDisconnectForfeits(match, RECONNECT_GRACE_MS - 1);
        expect(checked.players.find((p) => p.player.id === "p1")?.isEliminated).toBe(false);

        checked = applyDisconnectForfeits(match, RECONNECT_GRACE_MS + 1);
        expect(checked.players.find((p) => p.player.id === "p1")?.isEliminated).toBe(true);
    });

    it("une reconnexion annule le décompte", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = setPlayerConnection({match, playerId: "p1", isConnected: false, now: 0});
        match = setPlayerConnection({match, playerId: "p1", isConnected: true, now: 10});

        const checked = applyDisconnectForfeits(match, RECONNECT_GRACE_MS + 100);
        expect(checked.players.find((p) => p.player.id === "p1")?.isEliminated).toBe(false);
    });
});
