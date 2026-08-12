import {PlateauMatch, Player, Question} from "@/game/types";
import {createPlateauMatch, openPlateauRound} from "@/game/plateauEngine";
import {ALL_QUESTIONS} from "@/data/questions";
import ghosts from "@/data/ghosts";
import {computeNextRoundAt, playAvailableGhostTurns} from "./plateauOpponentDriver";

function buildPlayer(id: string, isGhost = false): Player {
    return {id, displayName: id, avatarUrl: null, isGhost};
}

const human = buildPlayer("human", false);
const ghostIds = ghosts.slice(0, 3).map((g) => g.id);
const ghostPlayers = ghostIds.map((id) => buildPlayer(id, true));

function newMatch(now = 0): PlateauMatch {
    return createPlateauMatch({id: "plateau-1", players: [human, ...ghostPlayers], now});
}

describe("computeNextRoundAt", () => {
    it("est déterministe pour une même partie et un même fantôme", () => {
        const match = newMatch();
        expect(computeNextRoundAt(match, ghostIds[0])).toBe(computeNextRoundAt(match, ghostIds[0]));
    });

    it("diffère d'un fantôme à l'autre", () => {
        const match = newMatch();
        const atA = computeNextRoundAt(match, ghostIds[0]);
        const atB = computeNextRoundAt(match, ghostIds[1]);
        expect(atA).not.toBe(atB);
    });
});

describe("playAvailableGhostTurns", () => {
    it("n'ouvre aucune manche pour un fantôme avant son heure", () => {
        const match = newMatch();
        const updated = playAvailableGhostTurns(match, ALL_QUESTIONS, 0);
        expect(updated.rounds.length).toBe(0);
    });

    it("ouvre et joue entièrement une manche pour chaque fantôme dont l'heure est passée", () => {
        const match = newMatch();
        const farFuture = Math.max(...ghostIds.map((id) => computeNextRoundAt(match, id))) + 1;

        const updated = playAvailableGhostTurns(match, ALL_QUESTIONS, farFuture);

        for (const ghostId of ghostIds) {
            const rounds = updated.rounds.filter((round) => round.playerId === ghostId);
            expect(rounds.length).toBe(1);
            expect(rounds[0].answers.length).toBe(3);
        }
    });

    it("termine la manche déjà ouverte d'un fantôme, même si son heure de rejouer n'est pas encore passée", () => {
        const match = newMatch();
        const opened = openPlateauRound({
            match,
            playerId: ghostIds[0],
            category: "sciences",
            questionIds: ["sci-001", "sci-002", "sci-003"],
        });

        const updated = playAvailableGhostTurns(opened, ALL_QUESTIONS, 0);
        const round = updated.rounds.find((r) => r.playerId === ghostIds[0]);
        expect(round?.answers.length).toBe(3);
    });

    it("ne touche plus aucun fantôme dès que la partie est déjà terminée", () => {
        const match = newMatch();
        const farFuture = Math.max(...ghostIds.map((id) => computeNextRoundAt(match, id))) + 1;
        const completedMatch: PlateauMatch = {...match, status: "completed"};

        const updated = playAvailableGhostTurns(completedMatch, ALL_QUESTIONS, farFuture);

        expect(updated.rounds.length).toBe(0);
        expect(updated.status).toBe("completed");
    });

    it("arrête d'enchaîner les fantômes dès que l'un d'eux termine la partie en cours de boucle", () => {
        // Fabrique un premier fantôme à une réponse du score gagnant : quelle que soit l'issue simulée par
        // decideAnswer, sa manche ouverte se termine (correcte ou non) et, si elle est correcte, la partie
        // se termine avant même que le deuxième fantôme n'ait été considéré.
        function correctAnswer(questionId: string, at: number, playerId: string) {
            return {questionId, playerId, selectedIndex: 0, isCorrect: true, elapsedMs: 1, answeredAt: at};
        }
        const fullRounds = Array.from({length: 7}, (_, roundIndex) => ({
            index: roundIndex,
            playerId: ghostIds[0],
            category: "histoire" as const,
            questionIds: [`r${roundIndex}-1`, `r${roundIndex}-2`, `r${roundIndex}-3`] as [string, string, string],
            openedAt: roundIndex * 3,
            answers: [`r${roundIndex}-1`, `r${roundIndex}-2`, `r${roundIndex}-3`].map((id, i) =>
                correctAnswer(id, roundIndex * 3 + i, ghostIds[0]),
            ),
        }));
        const openRound = {
            index: 7,
            playerId: ghostIds[0],
            category: "geographie" as const,
            questionIds: ["geo-001", "geo-002", "geo-003"] as [string, string, string],
            openedAt: 100,
            answers: [correctAnswer("geo-001", 100, ghostIds[0]), correctAnswer("geo-002", 101, ghostIds[0])],
        };

        const withPriorScore: PlateauMatch = {...newMatch(), rounds: [...fullRounds, openRound]};
        const updated = playAvailableGhostTurns(withPriorScore, ALL_QUESTIONS, 0);

        // Que la 24e réponse simulée soit juste ou fausse, la boucle ne doit jamais planter en essayant
        // de faire jouer un deuxième fantôme sur une partie déjà terminée.
        const firstGhostRound = updated.rounds.find((r) => r.index === 7);
        expect(firstGhostRound?.answers.length).toBe(3);
    });
});

describe("pool insuffisant", () => {
    it("n'ajoute aucune réponse si le pool fourni ne contient aucune question du thème tiré", () => {
        const match = newMatch();
        const farFuture = Math.max(...ghostIds.map((id) => computeNextRoundAt(match, id))) + 1;
        const emptyPool: Question[] = [];

        const updated = playAvailableGhostTurns(match, emptyPool, farFuture);

        for (const round of updated.rounds) {
            expect(round.answers.length).toBe(0);
        }
    });
});
