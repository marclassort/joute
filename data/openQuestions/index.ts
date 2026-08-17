import {OpenQuestion} from "@/game/types";
import anneesDisco from "./annees-disco";
import botanique from "./botanique";
import mythologieGrecque from "./mythologie-grecque";

export function validateOpenQuestionCorpus(questions: readonly OpenQuestion[]): void {
    const seenIds = new Set<string>();

    for (const question of questions) {
        if (seenIds.has(question.id)) {
            throw new Error(`identifiant de question dupliqué : ${question.id}`);
        }
        seenIds.add(question.id);

        if (question.theme.trim().length === 0) {
            throw new Error(`thème manquant pour ${question.id}`);
        }
        if (question.answer.trim().length === 0) {
            throw new Error(`réponse manquante pour ${question.id}`);
        }
        if (question.acceptableAnswers?.some((alt) => alt.trim().length === 0)) {
            throw new Error(`réponse acceptable vide pour ${question.id}`);
        }
    }
}

export const ALL_OPEN_QUESTIONS: OpenQuestion[] = [...botanique, ...anneesDisco, ...mythologieGrecque];

export const OPEN_QUESTION_THEMES: readonly string[] = [botanique[0].theme, anneesDisco[0].theme, mythologieGrecque[0].theme];

validateOpenQuestionCorpus(ALL_OPEN_QUESTIONS);
