import {Category, Match, Player} from "@/game/types";
import {chooseCategory, createMatch, resolveTurn, submitAnswer} from "@/game/engine";
import {ALL_QUESTIONS} from "@/data/questions";
import ghosts from "@/data/ghosts";
import {GhostOpponentDriver} from "./opponentDriver";

const human: Player = {id: "p1", displayName: "Alix", avatarUrl: null, isGhost: false};
const ghostId = "ghost-lucas";
const ghostPlayer: Player = {id: ghostId, displayName: "Lucas_Quiz", avatarUrl: null, isGhost: true};

function findQuestion(id: string) {
    const question = ALL_QUESTIONS.find((candidate) => candidate.id === id);
    if (!question) throw new Error(`question de test introuvable : ${id}`);
    return question;
}

function humanOpensAndPlaysRound(match: Match, category: Category, now: number): Match {
    const questionIds = ALL_QUESTIONS.filter((question) => question.category === category)
        .slice(0, 3)
        .map((question) => question.id) as [string, string, string];

    let next = chooseCategory({match, playerId: human.id, category, questionIds, now});
    for (const id of questionIds) {
        const question = findQuestion(id);
        next = submitAnswer({match: next, playerId: human.id, question, selectedIndex: question.correctIndex, elapsedMs: 4000, now});
    }
    return resolveTurn(next, now);
}

describe("GhostOpponentDriver.computeNextTurnAt", () => {
    it("est déterministe et tombe entre 2 et 20 minutes après updatedAt", () => {
        const match = createMatch({id: "m1", players: [human, ghostPlayer], now: 1_000_000});
        const first = GhostOpponentDriver.computeNextTurnAt(match, ghostId);
        const second = GhostOpponentDriver.computeNextTurnAt(match, ghostId);

        expect(first).toBe(second);
        expect(first).toBeGreaterThanOrEqual(match.updatedAt + 2 * 60 * 1000);
        expect(first).toBeLessThan(match.updatedAt + 20 * 60 * 1000);
    });
});

describe("GhostOpponentDriver.playTurn", () => {
    it("ne fait rien si ce n'est ni le tour du fantôme ni une manche à rattraper pour lui", () => {
        const match = createMatch({id: "m2", players: [human, ghostPlayer], now: 1_000_000});
        const result = GhostOpponentDriver.playTurn(match, ghostId, ALL_QUESTIONS, 1_000_000);
        expect(result).toEqual(match);
    });

    it("rattrape la manche ouverte par l'humain puis ouvre et joue la suivante", () => {
        const now = 1_000_000;
        const created = createMatch({id: "m3", players: [human, ghostPlayer], now});
        const afterHumanTurn = humanOpensAndPlaysRound(created, "histoire", now);

        expect(afterHumanTurn.currentTurnPlayerId).toBe(ghostId);
        expect(afterHumanTurn.currentRoundIndex).toBe(0);

        const afterGhostTurn = GhostOpponentDriver.playTurn(afterHumanTurn, ghostId, ALL_QUESTIONS, now + 60_000);

        expect(afterGhostTurn.rounds[0].answers.length).toBe(6);
        expect(afterGhostTurn.currentRoundIndex).toBe(1);
        expect(afterGhostTurn.rounds[1].chosenBy).toBe(ghostId);
        expect(afterGhostTurn.rounds[1].answers.length).toBe(3);
        expect(afterGhostTurn.rounds[1].category).not.toBe("histoire");
        expect(afterGhostTurn.currentTurnPlayerId).toBe(human.id);
        expect(afterGhostTurn.status).toBe("active");
    });

    it("ne répond jamais un index correct pour une réponse marquée fausse, et reste dans le temps de réponse plausible", () => {
        const now = 2_000_000;

        for (const ghost of ghosts) {
            const player: Player = {id: ghost.id, displayName: ghost.displayName, avatarUrl: null, isGhost: true};
            const created = createMatch({id: `m-${ghost.id}`, players: [human, player], now});
            const afterHumanTurn = humanOpensAndPlaysRound(created, "sciences", now);
            const afterGhostTurn = GhostOpponentDriver.playTurn(afterHumanTurn, ghost.id, ALL_QUESTIONS, now + 60_000);

            for (const answer of afterGhostTurn.rounds[0].answers.filter((a) => a.playerId === ghost.id)) {
                expect(answer.elapsedMs).toBeGreaterThanOrEqual(3000);
                expect(answer.elapsedMs).toBeLessThan(12000);
                expect(answer.selectedIndex).not.toBeNull();
                expect([0, 1, 2, 3]).toContain(answer.selectedIndex);

                if (!answer.isCorrect) {
                    const question = findQuestion(answer.questionId);
                    expect(answer.selectedIndex).not.toBe(question.correctIndex);
                }
            }
        }
    });

    it("donne le même résultat pour les mêmes entrées (déterminisme)", () => {
        const now = 3_000_000;
        const created = createMatch({id: "m4", players: [human, ghostPlayer], now});
        const afterHumanTurn = humanOpensAndPlaysRound(created, "arts", now);

        const first = GhostOpponentDriver.playTurn(afterHumanTurn, ghostId, ALL_QUESTIONS, now + 60_000);
        const second = GhostOpponentDriver.playTurn(afterHumanTurn, ghostId, ALL_QUESTIONS, now + 60_000);

        expect(first).toEqual(second);
    });
});
