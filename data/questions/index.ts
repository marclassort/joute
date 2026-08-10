import {Question} from "@/game/types";
import arts from "./arts";
import actualite from "./actualite";
import cinema from "./cinema";
import culturePop from "./culture-pop";
import gastronomie from "./gastronomie";
import geographie from "./geographie";
import histoire from "./histoire";
import insolite from "./insolite";
import langue from "./langue";
import logique from "./logique";
import musique from "./musique";
import nature from "./nature";
import sciences from "./sciences";
import societe from "./societe";
import sport from "./sport";

export function validateCorpus(questions: readonly Question[]): void {
    const seenIds = new Set<string>();

    for (const question of questions) {
        if (seenIds.has(question.id)) {
            throw new Error(`identifiant de question dupliqué : ${question.id}`);
        }
        seenIds.add(question.id);

        if (question.correctIndex < 0 || question.correctIndex > 3) {
            throw new Error(`correctIndex hors limites pour ${question.id}`);
        }

        const trimmedChoices = question.choices.map((choice) => choice.trim());
        const distinctChoices = new Set(trimmedChoices);
        if (trimmedChoices.some((choice) => choice.length === 0) || distinctChoices.size !== 4) {
            throw new Error(`propositions invalides pour ${question.id} : il faut 4 propositions non vides et distinctes`);
        }

        if (question.explanation.trim().length === 0) {
            throw new Error(`explication manquante pour ${question.id}`);
        }

        const isActualite = question.category === "actualite";
        if (isActualite !== question.perishable) {
            throw new Error(`seule la catégorie actualite peut être perishable : ${question.id}`);
        }
        if (question.perishable && (!question.source || !question.validUntil)) {
            throw new Error(`question périssable sans source/validUntil : ${question.id}`);
        }
        if (!question.perishable && question.validUntil) {
            throw new Error(`validUntil défini sur une question non périssable : ${question.id}`);
        }
    }
}

export const ALL_QUESTIONS: Question[] = [
    ...histoire,
    ...geographie,
    ...sciences,
    ...nature,
    ...arts,
    ...musique,
    ...cinema,
    ...sport,
    ...societe,
    ...culturePop,
    ...gastronomie,
    ...langue,
    ...logique,
    ...insolite,
    ...actualite,
];

validateCorpus(ALL_QUESTIONS);
