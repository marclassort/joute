import {Question} from "./types";
import {EpreuveKind, OneWinnerStageId} from "./oneWinnerTypes";
import {QUESTIONS_PER_EPREUVE, stageRulesFor} from "./oneWinnerConfig";

/** Type de la prochaine épreuve de l'étape, ou null si l'étape est déjà complète. */
export function nextEpreuveKind(stageId: OneWinnerStageId, epreuvesPlayedInStage: number): EpreuveKind | null {
    return stageRulesFor(stageId).epreuves[epreuvesPlayedInStage] ?? null;
}

/**
 * Choisit les questions de la prochaine épreuve. Le tirage n'a pas besoin d'être déterministe/rejouable
 * (contrairement au duel) : c'est l'appareil hôte, en direct, qui pioche pour toute la partie.
 */
export function pickEpreuveQuestions(pool: readonly Question[], kind: EpreuveKind, excludeIds: readonly string[]): string[] {
    const excluded = new Set(excludeIds);
    const candidates = pool.filter((question) => !excluded.has(question.id));
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUESTIONS_PER_EPREUVE[kind]).map((question) => question.id);
}
