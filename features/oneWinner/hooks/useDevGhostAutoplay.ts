import {useCallback, useEffect, useRef} from "react";
import {
    chooseChargeTheme,
    joinOneWinnerGame,
    OneWinnerGameSummary,
    submitChargeAnswer,
    submitJouteAnswer,
    submitMeleeAnswer,
} from "@/lib/oneWinnerApi";
import {createGhostGuest, GhostGuest} from "@/lib/devGhostGuests";
import {ALL_QUESTIONS} from "@/data/questions";
import {ALL_OPEN_QUESTIONS, OPEN_QUESTION_THEMES} from "@/data/openQuestions";
import {ALL_RIDDLES} from "@/data/riddles";
import {pickNextChargeQuestion} from "@/game/oneWinnerQuestionPicker";
import {JOUTE_FILET_THRESHOLD, jouteValueForElapsed} from "@/game/oneWinnerConfig";

const MIN_DELAY_MS = 900;
const MAX_DELAY_MS = 3200;
// Un fantôme trouve parfois la bonne réponse, parfois non — course réaliste plutôt qu'un groupe qui
// répond toujours juste ou toujours faux.
const CORRECT_CHANCE = 0.45;

function randomDelay(): number {
    return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function scheduleOnce(scheduled: Set<string>, key: string, action: () => void): void {
    if (scheduled.has(key)) return;
    scheduled.add(key);
    setTimeout(action, randomDelay());
}

/**
 * Fait jouer automatiquement des invités fantômes (dev uniquement, voir lib/devGhostGuests.ts) : ils
 * rejoignent la partie comme de vrais invités, choisissent un thème pour la Charge, puis
 * buzzent/répondent tout seuls avec un délai aléatoire à chaque manche, pour qu'un développeur seul
 * puisse observer l'UI/UX complète (Mêlée, Charge, Joute, élimination, victoire) sans piloter plusieurs
 * appareils. Ne fait rien hors développement (__DEV__ false) : spawnGhosts est un no-op en production.
 */
export function useDevGhostAutoplay(gameId: string, game: OneWinnerGameSummary | null) {
    const ghostsRef = useRef<GhostGuest[]>([]);
    const scheduledRef = useRef<Set<string>>(new Set());

    const spawnGhosts = useCallback(
        async (count: number) => {
            if (!__DEV__ || count <= 0) return;
            const newGhosts = Array.from({length: count}, () => createGhostGuest());
            ghostsRef.current = [...ghostsRef.current, ...newGhosts];
            await Promise.all(newGhosts.map((ghost) => joinOneWinnerGame(ghost.auth, gameId).catch(() => {})));
        },
        [gameId],
    );

    useEffect(() => {
        if (!__DEV__ || !game || ghostsRef.current.length === 0) return;

        for (const ghost of ghostsRef.current) {
            const ghostId = ghost.auth.guestId;
            const playerEntry = game.players.find((player) => player.id === ghostId);
            if (!playerEntry || playerEntry.isEliminated) continue;

            if (game.phase === "melee" && game.currentRound) {
                const current = game.currentRound.openedQuestions[game.currentRound.openedQuestions.length - 1];
                if (!current) continue;
                const alreadyAnswered = game.currentRound.answers.some((answer) => answer.playerId === ghostId && answer.questionId === current.questionId);
                if (alreadyAnswered) continue;
                const question = ALL_QUESTIONS.find((entry) => entry.id === current.questionId);
                if (!question) continue;
                scheduleOnce(scheduledRef.current, `melee:${current.questionId}:${ghostId}`, () => {
                    const selectedIndex = Math.random() < CORRECT_CHANCE ? question.correctIndex : Math.floor(Math.random() * 4);
                    submitMeleeAnswer(ghost.auth, gameId, {questionId: question.id, selectedIndex, elapsedMs: Math.round(randomDelay())}).catch(() => {});
                });
                continue;
            }

            if (game.phase === "charge-theme") {
                if (playerEntry.chargeTheme) continue;
                scheduleOnce(scheduledRef.current, `charge-theme:${ghostId}`, () => {
                    const theme = OPEN_QUESTION_THEMES[Math.floor(Math.random() * OPEN_QUESTION_THEMES.length)];
                    chooseChargeTheme(ghost.auth, gameId, theme).catch(() => {});
                });
                continue;
            }

            if (game.phase === "charge" && game.currentRound && playerEntry.chargeTheme) {
                const answeredIds = game.currentRound.answers.filter((answer) => answer.playerId === ghostId).map((answer) => answer.questionId);
                const question = pickNextChargeQuestion(ALL_OPEN_QUESTIONS, playerEntry.chargeTheme, answeredIds);
                if (!question) continue;
                scheduleOnce(scheduledRef.current, `charge:${question.id}:${ghostId}`, () => {
                    const submittedText = Math.random() < CORRECT_CHANCE ? question.answer : "je ne sais pas";
                    submitChargeAnswer(ghost.auth, gameId, {questionId: question.id, submittedText, elapsedMs: Math.round(randomDelay())}).catch(() => {});
                });
                continue;
            }

            if (game.phase === "joute" && game.currentRound) {
                const current = game.currentRound.openedQuestions[game.currentRound.openedQuestions.length - 1];
                if (!current) continue;
                const riddle = ALL_RIDDLES.find((entry) => entry.id === current.questionId);
                if (!riddle) continue;
                const lastWrong = [...game.currentRound.answers]
                    .reverse()
                    .find((answer) => answer.playerId === ghostId && answer.questionId === current.questionId && !answer.isCorrect && !answer.usedFilet);
                // Pas d'horodatage exposé côté client pour la dernière tentative — un fantôme respecte le
                // même délai de blocage en se contentant simplement de ne pas retenter dans les 3 secondes
                // qui suivent sa propre programmation précédente (voir la clé incluant un compteur ci-dessous).
                if (lastWrong) continue;
                const value = jouteValueForElapsed(Date.now() - current.openedAt);
                const attempt = game.currentRound.answers.filter((answer) => answer.playerId === ghostId && answer.questionId === current.questionId).length;
                scheduleOnce(scheduledRef.current, `joute:${current.questionId}:${ghostId}:${attempt}`, () => {
                    if (value > 0 && value <= JOUTE_FILET_THRESHOLD && Math.random() < 0.5) {
                        const selectedIndex = Math.random() < CORRECT_CHANCE ? riddle.correctIndex : Math.floor(Math.random() * 4);
                        submitJouteAnswer(ghost.auth, gameId, {riddleId: riddle.id, selectedIndex}).catch(() => {});
                        return;
                    }
                    const submittedText = Math.random() < CORRECT_CHANCE ? riddle.answer : "aucune idee";
                    submitJouteAnswer(ghost.auth, gameId, {riddleId: riddle.id, submittedText}).catch(() => {});
                });
            }
        }
    }, [gameId, game]);

    return {spawnGhosts, ghostCount: ghostsRef.current.length};
}
