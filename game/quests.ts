/** Sous la barre : une réponse compte comme « rapide » pour les quêtes de vitesse (voir project-update/). */
export const FAST_ANSWER_THRESHOLD_MS = 4_000;

/** Paliers du parcours de quêtes, en nombre cumulé de réponses rapides et correctes. */
export const QUEST_CHAIN_THRESHOLDS = [5, 15, 30, 50, 75, 100] as const;

export function isFastCorrectAnswer(isCorrect: boolean, elapsedMs: number): boolean {
    return isCorrect && elapsedMs <= FAST_ANSWER_THRESHOLD_MS;
}

export interface QuestChainTier {
    threshold: number;
    isDone: boolean;
}

export function computeQuestChain(fastAnswers: number): QuestChainTier[] {
    return QUEST_CHAIN_THRESHOLDS.map((threshold) => ({threshold, isDone: fastAnswers >= threshold}));
}

/** Premier palier non atteint, ou null si le parcours est complet. */
export function nextQuestTier(fastAnswers: number): QuestChainTier | null {
    return computeQuestChain(fastAnswers).find((tier) => !tier.isDone) ?? null;
}
