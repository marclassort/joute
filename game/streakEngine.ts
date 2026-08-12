import {Question} from "./types";
import {isAnswerCorrect} from "./textMatch";

export interface StreakAnswer {
    questionId: string;
    submittedText: string;
    isCorrect: boolean;
    usedHint: boolean;
    elapsedMs: number;
}

export function buildStreakAnswer(question: Question, submittedText: string, usedHint: boolean, elapsedMs: number): StreakAnswer {
    return {
        questionId: question.id,
        submittedText,
        isCorrect: isAnswerCorrect(submittedText, question.choices[question.correctIndex]),
        usedHint,
        elapsedMs,
    };
}

/** Course de survie : la série s'arrête à la première réponse fausse, donc c'est simplement le nombre de bonnes réponses tant qu'il n'y en a pas eu de fausse. */
export function computeCurrentStreak(answers: readonly StreakAnswer[]): number {
    let streak = 0;
    for (const answer of answers) {
        if (!answer.isCorrect) break;
        streak += 1;
    }
    return streak;
}

/** Indice affiché quand le joueur bloque : la première lettre de la réponse attendue. */
export function computeHint(question: Question): string {
    return question.choices[question.correctIndex].charAt(0).toUpperCase();
}
