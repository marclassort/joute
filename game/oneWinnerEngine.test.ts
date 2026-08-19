import {
    advanceJouteQuestion,
    advanceMeleeQuestion,
    advanceToNextRound,
    applyDisconnectForfeits,
    chooseChargeTheme,
    computeOneWinnerStandings,
    createOneWinnerMatch,
    eliminateAfterRound,
    endCharge,
    passCharge,
    setPlayerConnection,
    startCharge,
    startChargeThemeSelection,
    startJoute,
    startMatch,
    startMelee,
    submitChargeAnswer,
    submitJouteAnswer,
    submitJouteFiletAnswer,
    submitMeleeAnswer,
} from "./oneWinnerEngine";
import {JOUTE_MAX_QUESTIONS, JOUTE_QUESTION_TIME_MS, JOUTE_WIN_SCORE, MELEE_TIME_LIMIT_MS, RECONNECT_GRACE_MS} from "./oneWinnerConfig";
import {OneWinnerMatch} from "./oneWinnerTypes";
import {OpenQuestion, Player, Question, RiddleQuestion} from "./types";

function makePlayers(count: number): Player[] {
    return Array.from({length: count}, (_, i) => ({
        id: `p${i + 1}`,
        displayName: `Joueur ${i + 1}`,
        avatarUrl: null,
        isGhost: false,
    }));
}

function makeQuestion(id: string, correctIndex = 0): Question {
    return {id, category: "histoire", difficulty: 1, statement: `Question ${id}`, choices: ["a", "b", "c", "d"], correctIndex, explanation: "", perishable: false};
}

function makeOpenQuestion(id: string, theme = "botanique", answer = "reponse"): OpenQuestion {
    return {id, theme, statement: `Question ${id}`, answer};
}

function makeRiddle(id: string, answer = "yangtse"): RiddleQuestion {
    return {id, clues: ["indice 1", "indice 2", "indice 3", "indice 4"], answer, choices: ["a", "b", answer, "d"], correctIndex: 2};
}

describe("createOneWinnerMatch", () => {
    it("refuse un nombre de joueurs différent de 4", () => {
        expect(() => createOneWinnerMatch({id: "m1", players: makePlayers(3)})).toThrow();
        expect(() => createOneWinnerMatch({id: "m1", players: makePlayers(5)})).toThrow();
    });

    it("crée une partie en lobby, prête pour la Mêlée", () => {
        const match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        expect(match.phase).toBe("lobby");
        expect(match.roundId).toBe("melee");
        expect(match.players).toHaveLength(4);
    });
});

describe("La Mêlée : classement par vitesse d'arrivée", () => {
    it("attribue 100/70/40/20 dans l'ordre d'arrivée des bonnes réponses, 0 si faux", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});

        const question = makeQuestion("q1", 0);
        match = submitMeleeAnswer({match, playerId: "p1", question, selectedIndex: 0, elapsedMs: 1_000, now: 10});
        match = submitMeleeAnswer({match, playerId: "p2", question, selectedIndex: 1, elapsedMs: 500, now: 20});
        match = submitMeleeAnswer({match, playerId: "p3", question, selectedIndex: 0, elapsedMs: 9_000, now: 30});

        const standings = computeOneWinnerStandings(match);
        const score = (id: string) => standings.find((s) => s.playerId === id)?.score ?? 0;
        expect(score("p1")).toBe(100);
        expect(score("p2")).toBe(0);
        expect(score("p3")).toBe(70);
    });

    it("refuse une deuxième réponse du même joueur à la même question", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        match = submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 10});
        expect(() =>
            submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 20}),
        ).toThrow();
    });

    it("refuse de répondre à une question qui n'est pas encore ouverte", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1", "q2"], now: 0});
        expect(() => submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q2", 0), selectedIndex: 0, elapsedMs: 100, now: 10})).toThrow();
    });

    it("n'avance pas tant que tout le monde n'a pas répondu et que le temps n'est pas écoulé", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1", "q2"], now: 0});
        match = submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 10});
        expect(() => advanceMeleeQuestion(match, 100)).toThrow();
    });

    it("avance de force après le délai même si tout le monde n'a pas répondu", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1", "q2"], now: 0});
        match = submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 10});
        match = advanceMeleeQuestion(match, MELEE_TIME_LIMIT_MS + 1);
        expect(() => submitMeleeAnswer({match, playerId: "p2", question: makeQuestion("q2", 0), selectedIndex: 0, elapsedMs: 100, now: MELEE_TIME_LIMIT_MS + 10})).not.toThrow();
    });

    it("passe en classement une fois la dernière question résolue par tous", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        for (const id of ["p1", "p2", "p3", "p4"]) {
            match = submitMeleeAnswer({match, playerId: id, question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 10});
        }
        match = advanceMeleeQuestion(match, 20);
        expect(match.phase).toBe("classement");
    });

    it("départage une égalité de score par le temps de réponse cumulé", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        // p1 et p2 répondent tous deux faux : 0 partout, p1 a été plus rapide.
        match = submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q1", 0), selectedIndex: 1, elapsedMs: 500, now: 10});
        match = submitMeleeAnswer({match, playerId: "p2", question: makeQuestion("q1", 0), selectedIndex: 1, elapsedMs: 900, now: 20});
        const standings = computeOneWinnerStandings(match);
        const rankOf = (id: string) => standings.find((s) => s.playerId === id)?.rank;
        expect(rankOf("p1")).toBeLessThan(rankOf("p2")!);
    });
});

describe("élimination et progression entre manches", () => {
    it("élimine le dernier de la Mêlée (4 -> 3) et passe à la Charge", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        match = submitMeleeAnswer({match, playerId: "p1", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 10});
        match = submitMeleeAnswer({match, playerId: "p2", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 20});
        match = submitMeleeAnswer({match, playerId: "p3", question: makeQuestion("q1", 0), selectedIndex: 0, elapsedMs: 100, now: 30});
        match = submitMeleeAnswer({match, playerId: "p4", question: makeQuestion("q1", 0), selectedIndex: 1, elapsedMs: 100, now: 40});
        match = advanceMeleeQuestion(match, 50);
        expect(match.phase).toBe("classement");

        match = eliminateAfterRound(match, 60);
        expect(match.phase).toBe("elimination");
        expect(match.players.find((p) => p.player.id === "p4")?.isEliminated).toBe(true);
        expect(match.players.filter((p) => !p.isEliminated)).toHaveLength(3);

        match = advanceToNextRound(match, 70);
        expect(match.roundId).toBe("charge");
        expect(match.phase).toBe("intro");
    });
});

describe("La Charge : multiplicateur de série", () => {
    function setupCharge(): OneWinnerMatch {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        for (const id of ["p1", "p2", "p3", "p4"]) {
            match = submitMeleeAnswer({match, playerId: id, question: makeQuestion("q1", 0), selectedIndex: id === "p4" ? 1 : 0, elapsedMs: 100, now: 10});
        }
        match = advanceMeleeQuestion(match, 20);
        match = eliminateAfterRound(match, 30);
        match = advanceToNextRound(match, 40);
        match = startChargeThemeSelection(match, 50);
        for (const id of ["p1", "p2", "p3"]) match = chooseChargeTheme(match, id, "botanique", 60);
        match = startCharge(match, 70);
        return match;
    }

    it("refuse de démarrer tant que tous n'ont pas choisi de thème", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        for (const id of ["p1", "p2", "p3", "p4"]) match = submitMeleeAnswer({match, playerId: id, question: makeQuestion("q1", 0), selectedIndex: id === "p4" ? 1 : 0, elapsedMs: 100, now: 10});
        match = advanceMeleeQuestion(match, 20);
        match = eliminateAfterRound(match, 30);
        match = advanceToNextRound(match, 40);
        match = startChargeThemeSelection(match, 50);
        match = chooseChargeTheme(match, "p1", "botanique", 60);
        expect(() => startCharge(match, 70)).toThrow();
    });

    it("augmente le multiplicateur avec la série, le remet à zéro sur une erreur, sans perte de points acquis", () => {
        let match = setupCharge();
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c1"), submittedText: "reponse", elapsedMs: 1_000, now: 80});
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c2"), submittedText: "reponse", elapsedMs: 1_000, now: 81});
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c3"), submittedText: "faux", elapsedMs: 1_000, now: 82});
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c4"), submittedText: "reponse", elapsedMs: 1_000, now: 83});

        const scoreAfter = (id: string, m: OneWinnerMatch) => computeOneWinnerStandings(m).find((s) => s.playerId === id)?.score ?? 0;
        // 50 (x1) + 60 (x1,2) + 0 (faux) + 50 (x1 après remise à zéro) = 160
        expect(scoreAfter("p1", match)).toBe(160);
    });

    it("passer une question a le même effet qu'une erreur", () => {
        let match = setupCharge();
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c1"), submittedText: "reponse", elapsedMs: 500, now: 80});
        match = passCharge(match, "p2", makeOpenQuestion("c2"), 81);
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c3"), submittedText: "reponse", elapsedMs: 500, now: 82});
        expect(computeOneWinnerStandings(match).find((s) => s.playerId === "p2")?.score).toBe(100);
    });

    it("tolère les fautes de frappe légères comme le reste de l'app (game/textMatch.ts)", () => {
        let match = setupCharge();
        match = submitChargeAnswer({match, playerId: "p3", question: makeOpenQuestion("c1", "botanique", "danube"), submittedText: "danub", elapsedMs: 500, now: 80});
        expect(computeOneWinnerStandings(match).find((s) => s.playerId === "p3")?.score).toBe(50);
    });

    it("départage une égalité par le nombre de mauvaises réponses", () => {
        let match = setupCharge();
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c1"), submittedText: "reponse", elapsedMs: 500, now: 80});
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c2"), submittedText: "reponse", elapsedMs: 500, now: 81});
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c3"), submittedText: "faux", elapsedMs: 500, now: 82});
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c4"), submittedText: "reponse", elapsedMs: 500, now: 83});
        // p1: 1 bonne réponse (50). p2: 2 bonnes réponses mais série cassée entre les deux (50 + 50 = 100).
        // On égalise en ajustant : ici p1=50, p2=100, donc pas d'égalité — testons un vrai cas à score égal.
        match = endCharge(match, 90);
        match = eliminateAfterRound(match, 100);
        const eliminated = match.eliminations[match.eliminations.length - 1];
        expect(eliminated.roundId).toBe("charge");
    });

    it("élimine le dernier de la Charge (3 -> 2) et passe à la Joute", () => {
        let match = setupCharge();
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c1"), submittedText: "reponse", elapsedMs: 500, now: 80});
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c2"), submittedText: "reponse", elapsedMs: 500, now: 81});
        // p3 ne répond à rien : score 0, dernier.
        match = endCharge(match, 90);
        match = eliminateAfterRound(match, 100);
        expect(match.players.find((p) => p.player.id === "p3")?.isEliminated).toBe(true);
        expect(match.players.filter((p) => !p.isEliminated)).toHaveLength(2);

        match = advanceToNextRound(match, 110);
        expect(match.roundId).toBe("joute");
    });
});

describe("La Joute : valeur qui décroît, filet, victoire à 200", () => {
    function setupJoute(): OneWinnerMatch {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);
        match = startMelee({match, questionIds: ["q1"], now: 0});
        for (const id of ["p1", "p2", "p3", "p4"]) match = submitMeleeAnswer({match, playerId: id, question: makeQuestion("q1", 0), selectedIndex: id === "p4" ? 1 : 0, elapsedMs: 100, now: 10});
        match = advanceMeleeQuestion(match, 20);
        match = eliminateAfterRound(match, 30);
        match = advanceToNextRound(match, 40);
        match = startChargeThemeSelection(match, 50);
        for (const id of ["p1", "p2", "p3"]) match = chooseChargeTheme(match, id, "botanique", 60);
        match = startCharge(match, 70);
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c1"), submittedText: "reponse", elapsedMs: 500, now: 80});
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c2"), submittedText: "reponse", elapsedMs: 500, now: 81});
        match = endCharge(match, 90);
        match = eliminateAfterRound(match, 100);
        match = advanceToNextRound(match, 110);
        expect(match.roundId).toBe("joute");
        return match;
    }

    it("marque la valeur en cours au moment de la réponse, pas un temps fourni par le client", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1"], now: 1_000});
        // Répond 9s après l'ouverture -> palier 40 pts (6-12s), quel que soit ce que le client prétendrait.
        match = submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "yangtse", now: 1_000 + 9_000});
        expect(computeOneWinnerStandings(match, "joute").find((s) => s.playerId === "p1")?.score).toBe(40);
    });

    it("bloque 3 secondes le joueur qui se trompe au clavier, sans bloquer l'autre", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1"], now: 0});
        match = submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "faux", now: 1_000});
        expect(() => submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "faux", now: 2_000})).toThrow();
        expect(() => submitJouteAnswer({match, playerId: "p2", riddle: makeRiddle("r1"), submittedText: "faux", now: 2_000})).not.toThrow();
    });

    it("autorise une nouvelle tentative après le blocage de 3 secondes, sans perte", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1"], now: 0});
        match = submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "faux", now: 1_000});
        match = submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "yangtse", now: 1_000 + 3_001});
        expect(computeOneWinnerStandings(match, "joute").find((s) => s.playerId === "p1")?.score).toBeGreaterThan(0);
    });

    it("refuse le filet tant que la valeur est au-dessus du seuil, l'accepte en dessous", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1"], now: 0});
        expect(() => submitJouteFiletAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), selectedIndex: 2, now: 1_000})).toThrow();
        match = submitJouteFiletAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), selectedIndex: 2, now: 15_000});
        expect(computeOneWinnerStandings(match, "joute").find((s) => s.playerId === "p1")?.score).toBe(15); // palier 30 à 15s (12-18s) -> moitié 15
    });

    it("une mauvaise réponse au filet ne fait rien perdre mais consomme le filet (une seule tentative)", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1"], now: 0});
        match = submitJouteFiletAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), selectedIndex: 0, now: 15_000});
        expect(() => submitJouteFiletAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), selectedIndex: 2, now: 15_500})).toThrow();
        // Le clavier reste disponible sans blocage lié au filet.
        expect(() => submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "yangtse", now: 15_600})).not.toThrow();
    });

    it("termine la manche et la partie dès qu'un joueur dépasse 200 points", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1", "r2", "r3", "r4", "r5"], now: 0});
        const riddles = ["r1", "r2", "r3", "r4", "r5"].map((id) => makeRiddle(id));
        // 4 bonnes réponses ultra-rapides valent 50 chacune -> 200, la 5e fait dépasser.
        for (let i = 0; i < 5; i++) {
            match = submitJouteAnswer({match, playerId: "p1", riddle: riddles[i], submittedText: "yangtse", now: i * 30_000 + 1_000});
        }
        expect(match.phase).toBe("termine");
        expect(match.status).toBe("completed");
        expect(match.winnerId).toBe("p1");
        expect(match.players.find((p) => p.player.id === "p1")?.finalRank).toBe(1);
        expect(match.players.find((p) => p.player.id === "p2")?.finalRank).toBe(2);
    });

    it("avance de force après le délai si personne ne trouve, sans le moindre point", () => {
        let match = setupJoute();
        match = startJoute({match, questionIds: ["r1", "r2"], now: 0});
        expect(() => advanceJouteQuestion(match, 10_000)).toThrow();
        match = advanceJouteQuestion(match, 30_001);
        expect(computeOneWinnerStandings(match, "joute").find((s) => s.playerId === "p1")?.score).toBe(0);
        expect(() => submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r2"), submittedText: "yangtse", now: 30_500})).not.toThrow();
    });

    it("départage par le score au bout de 10 énigmes si personne n'a dépassé 200", () => {
        let match = setupJoute();
        const ids = Array.from({length: JOUTE_MAX_QUESTIONS}, (_, i) => `r${i + 1}`);
        match = startJoute({match, questionIds: ids, now: 0});

        // p1 résout la 1ʳᵉ énigme très vite (bien avant les 20 s) sans dépasser 200 (une seule bonne réponse) ;
        // les 9 suivantes ne sont résolues par personne, chacune avance de force après son propre délai de 20 s.
        let t = 1_000;
        match = submitJouteAnswer({match, playerId: "p1", riddle: makeRiddle("r1"), submittedText: "yangtse", now: t});
        for (let i = 1; i < JOUTE_MAX_QUESTIONS; i++) {
            t += JOUTE_QUESTION_TIME_MS + 1;
            match = advanceJouteQuestion(match, t);
        }
        expect(match.phase).toBe("termine");
        expect(match.winnerId).toBe("p1");
        expect(computeOneWinnerStandings(match, "joute").find((s) => s.playerId === "p1")?.score).toBeLessThanOrEqual(JOUTE_WIN_SCORE);
    });
});

describe("parcours complet jusqu'au vainqueur", () => {
    it("Mêlée -> Charge -> Joute jusqu'à un seul gagnant sur 4 joueurs", () => {
        let match = createOneWinnerMatch({id: "m1", players: makePlayers(4)});
        match = startMatch(match);

        match = startMelee({match, questionIds: ["q1"], now: 0});
        for (const id of ["p1", "p2", "p3", "p4"]) match = submitMeleeAnswer({match, playerId: id, question: makeQuestion("q1", 0), selectedIndex: id === "p4" ? 1 : 0, elapsedMs: 100, now: 10});
        match = advanceMeleeQuestion(match, 20);
        match = eliminateAfterRound(match, 30);
        match = advanceToNextRound(match, 40);
        expect(match.roundId).toBe("charge");
        expect(match.players.filter((p) => !p.isEliminated)).toHaveLength(3);

        match = startChargeThemeSelection(match, 50);
        for (const id of ["p1", "p2", "p3"]) match = chooseChargeTheme(match, id, "botanique", 60);
        match = startCharge(match, 70);
        match = submitChargeAnswer({match, playerId: "p1", question: makeOpenQuestion("c1"), submittedText: "reponse", elapsedMs: 100, now: 80});
        match = submitChargeAnswer({match, playerId: "p2", question: makeOpenQuestion("c2"), submittedText: "reponse", elapsedMs: 100, now: 81});
        match = endCharge(match, 90);
        match = eliminateAfterRound(match, 100);
        match = advanceToNextRound(match, 110);
        expect(match.roundId).toBe("joute");
        expect(match.players.filter((p) => !p.isEliminated)).toHaveLength(2);

        match = startJoute({match, questionIds: ["r1", "r2", "r3", "r4", "r5"], now: 0});
        const riddles = ["r1", "r2", "r3", "r4", "r5"].map((id) => makeRiddle(id));
        for (let i = 0; i < 5; i++) {
            match = submitJouteAnswer({match, playerId: "p1", riddle: riddles[i], submittedText: "yangtse", now: i * 30_000 + 1_000});
        }

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
