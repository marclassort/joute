import {Question} from "./types";

export interface SoloAnswer {
    questionId: string;
    selectedIndex: number | null;
    isCorrect: boolean;
    elapsedMs: number;
}

export function buildSoloAnswer(question: Question, selectedIndex: number | null, elapsedMs: number): SoloAnswer {
    return {
        questionId: question.id,
        selectedIndex,
        isCorrect: selectedIndex !== null && selectedIndex === question.correctIndex,
        elapsedMs,
    };
}

export function computeSoloScore(answers: readonly SoloAnswer[]): number {
    return answers.filter((answer) => answer.isCorrect).length;
}

export function computeAverageResponseMs(answers: readonly SoloAnswer[]): number {
    if (answers.length === 0) return 0;
    return answers.reduce((sum, answer) => sum + answer.elapsedMs, 0) / answers.length;
}

export function computeLongestCorrectStreak(answers: readonly SoloAnswer[]): number {
    let longest = 0;
    let current = 0;
    for (const answer of answers) {
        if (answer.isCorrect) {
            current += 1;
            longest = Math.max(longest, current);
        } else {
            current = 0;
        }
    }
    return longest;
}
