import dayjs from "dayjs";

/** XP nécessaire pour passer un niveau (courbe linéaire volontairement simple). */
export const XP_PER_LEVEL = 100;

export function computeLevel(totalXp: number): number {
    return 1 + Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL);
}

/** Progression dans le niveau courant, de 0 (vient de monter de niveau) à 1 (sur le point de monter). */
export function computeLevelProgress(totalXp: number): number {
    return (Math.max(0, totalXp) % XP_PER_LEVEL) / XP_PER_LEVEL;
}

export function dateKey(now: number = Date.now()): string {
    return dayjs(now).format("YYYY-MM-DD");
}

export interface StreakState {
    currentStreak: number;
    longestStreak: number;
    lastPlayedDate: string | null;
}

/**
 * Met à jour la série de jours joués consécutifs. Rejouer le même jour ne change rien ; jouer le
 * lendemain du dernier jour joué incrémente la série ; sauter un jour la remet à 1.
 */
export function updateStreak(state: StreakState, today: string): StreakState {
    if (state.lastPlayedDate === today) return state;

    const yesterday = dayjs(today).subtract(1, "day").format("YYYY-MM-DD");
    const isConsecutive = state.lastPlayedDate === yesterday;
    const currentStreak = isConsecutive ? state.currentStreak + 1 : 1;

    return {currentStreak, longestStreak: Math.max(state.longestStreak, currentStreak), lastPlayedDate: today};
}

export const XP_PER_CORRECT_SOLO = 2;
export const XP_PER_CORRECT_DUEL = 5;
export const XP_PER_CORRECT_PLATEAU = 5;
export const XP_DUEL_WIN_BONUS = 20;
export const XP_PLATEAU_WIN_BONUS = 30;
