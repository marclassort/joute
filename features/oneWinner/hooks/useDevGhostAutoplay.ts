import {useCallback, useEffect, useRef} from "react";
import {joinOneWinnerGame, OneWinnerGameSummary, recordOneWinnerBuzz, submitOneWinnerAnswer} from "@/lib/oneWinnerApi";
import {createGhostGuest, GhostGuest} from "@/lib/devGhostGuests";

const MIN_DELAY_MS = 900;
const MAX_DELAY_MS = 3200;
// Un fantôme ne se rue pas systématiquement sur le buzz : ça garde la course réaliste plutôt qu'un
// verrouillage instantané et permet aussi de voir l'état "personne n'a encore buzzé" à l'écran.
const BUZZ_ATTEMPT_CHANCE = 0.7;

function randomDelay(): number {
    return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function randomChoiceIndex(): number {
    return Math.floor(Math.random() * 4);
}

function scheduleOnce(scheduled: Set<string>, key: string, action: () => void): void {
    if (scheduled.has(key)) return;
    scheduled.add(key);
    setTimeout(action, randomDelay());
}

/**
 * Fait jouer automatiquement des invités fantômes (dev uniquement, voir lib/devGhostGuests.ts) : ils
 * rejoignent la partie comme de vrais invités, puis buzzent/répondent tout seuls avec un délai
 * aléatoire dès qu'une épreuve s'ouvre, pour qu'un développeur seul puisse observer l'UI/UX complète
 * (course au buzz, classement, élimination...) sans piloter plusieurs appareils.
 *
 * Ne fait rien hors développement (__DEV__ false) : spawnGhosts est un no-op en production.
 */
export function useDevGhostAutoplay(gameId: string, game: OneWinnerGameSummary | null) {
    const ghostsRef = useRef<GhostGuest[]>([]);
    // Clé "action:questionId:guestId" déjà planifiée, pour ne pas programmer deux fois le même setTimeout
    // à chaque rafraîchissement de `game` tant que l'action n'a pas encore été confirmée par le serveur.
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
        if (!__DEV__ || !game?.currentEpreuve || ghostsRef.current.length === 0) return;
        const epreuve = game.currentEpreuve;

        for (const ghost of ghostsRef.current) {
            const ghostId = ghost.auth.guestId;
            const playerEntry = game.players.find((player) => player.id === ghostId);
            if (!playerEntry || playerEntry.isEliminated) continue;

            if (epreuve.kind === "buzzer") {
                const resolvedIds = new Set(epreuve.answers.filter((answer) => answer.isCorrect).map((answer) => answer.questionId));
                const currentQuestionId = epreuve.questionIds.find((id) => !resolvedIds.has(id));
                if (!currentQuestionId) continue;

                if (epreuve.buzzHolder === ghostId) {
                    scheduleOnce(scheduledRef.current, `answer:${currentQuestionId}:${ghostId}`, () => {
                        submitOneWinnerAnswer(ghost.auth, gameId, {
                            questionId: currentQuestionId,
                            selectedIndex: randomChoiceIndex(),
                            elapsedMs: Math.round(randomDelay()),
                        }).catch(() => {});
                    });
                } else if (!epreuve.buzzHolder) {
                    const alreadyWrong = epreuve.answers.some(
                        (answer) => answer.playerId === ghostId && answer.questionId === currentQuestionId && !answer.isCorrect,
                    );
                    if (alreadyWrong) continue;
                    scheduleOnce(scheduledRef.current, `buzz:${currentQuestionId}:${ghostId}`, () => {
                        if (Math.random() > BUZZ_ATTEMPT_CHANCE) return;
                        recordOneWinnerBuzz(ghost.auth, gameId, currentQuestionId).catch(() => {});
                    });
                }
                continue;
            }

            // Défi / Conquête : pas de course au buzz, chaque fantôme répond à son rythme à chaque question.
            const myScore = game.liveStandings.find((standing) => standing.playerId === ghostId)?.score ?? 0;
            for (const questionId of epreuve.questionIds) {
                const alreadyAnswered = epreuve.answers.some((answer) => answer.playerId === ghostId && answer.questionId === questionId);
                if (alreadyAnswered) continue;

                scheduleOnce(scheduledRef.current, `answer:${questionId}:${ghostId}`, () => {
                    const wager = epreuve.kind === "conquete" ? Math.max(10, Math.round(myScore * (0.1 + Math.random() * 0.4))) : undefined;
                    submitOneWinnerAnswer(ghost.auth, gameId, {
                        questionId,
                        selectedIndex: randomChoiceIndex(),
                        elapsedMs: Math.round(randomDelay()),
                        wager,
                    }).catch(() => {});
                });
            }
        }
    }, [gameId, game]);

    return {spawnGhosts, ghostCount: ghostsRef.current.length};
}
