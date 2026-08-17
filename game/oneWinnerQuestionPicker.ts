import {OpenQuestion, Question, RiddleQuestion} from "./types";
import {JOUTE_MAX_QUESTIONS, MELEE_QUESTION_COUNT} from "./oneWinnerConfig";

function shuffle<T>(items: readonly T[]): T[] {
    return [...items].sort(() => Math.random() - 0.5);
}

/** Pioche les 6 questions de la Mêlée dans le pool MCQ général. Le tirage n'a pas besoin d'être
 * déterministe/rejouable (contrairement au duel) : c'est l'hôte, en direct, qui pioche pour toute la partie. */
export function pickMeleeQuestions(pool: readonly Question[], excludeIds: readonly string[] = []): string[] {
    const excluded = new Set(excludeIds);
    const candidates = pool.filter((question) => !excluded.has(question.id));
    return shuffle(candidates)
        .slice(0, MELEE_QUESTION_COUNT)
        .map((question) => question.id);
}

/** Pioche jusqu'à 10 énigmes pour la Joute (voir JOUTE_MAX_QUESTIONS). */
export function pickJouteQuestions(pool: readonly RiddleQuestion[], excludeIds: readonly string[] = []): string[] {
    const excluded = new Set(excludeIds);
    const candidates = pool.filter((riddle) => !excluded.has(riddle.id));
    return shuffle(candidates)
        .slice(0, JOUTE_MAX_QUESTIONS)
        .map((riddle) => riddle.id);
}

/**
 * Prochaine question de la Charge pour CE joueur dans son thème choisi. Contrairement à la Mêlée/la
 * Joute (question partagée, piochée une fois par l'hôte pour toute la partie), la Charge n'a pas de
 * liste commune : chaque joueur avance à son propre rythme dans son propre thème, une question à la
 * fois, jamais deux fois la même. Retourne null si le pool de ce thème est épuisé pour ce joueur.
 */
export function pickNextChargeQuestion(pool: readonly OpenQuestion[], theme: string, excludeIds: readonly string[]): OpenQuestion | null {
    const excluded = new Set(excludeIds);
    const candidates = pool.filter((question) => question.theme === theme && !excluded.has(question.id));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)];
}
