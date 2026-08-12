import AsyncStorage from "@react-native-async-storage/async-storage";
import {StreakState, dateKey, updateStreak} from "@/game/gamification";

export interface GamificationState extends StreakState {
    totalXp: number;
    /** Identifiants des parties (duel/plateau) déjà récompensées, pour ne jamais créditer deux fois le même match. */
    rewardedMatchIds: string[];
}

const STORAGE_KEY = "joute:gamification";

const EMPTY_STATE: GamificationState = {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    rewardedMatchIds: [],
};

async function readState(): Promise<GamificationState> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GamificationState) : EMPTY_STATE;
}

async function writeState(state: GamificationState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const localGamificationRepository = {
    async get(): Promise<GamificationState> {
        return readState();
    },

    /** Crédite de l'XP et marque la journée comme jouée (série de jours consécutifs). Sûr à appeler plusieurs fois par jour. */
    async awardXp(amount: number, now: number = Date.now()): Promise<GamificationState> {
        const state = await readState();
        const streak = updateStreak(state, dateKey(now));
        const updated: GamificationState = {...state, ...streak, totalXp: state.totalXp + amount};
        await writeState(updated);
        return updated;
    },

    /** Comme awardXp, mais no-op si matchId a déjà été récompensé — protège contre un double crédit en revisitant un résultat de match. */
    async awardXpForMatch(matchId: string, amount: number, now: number = Date.now()): Promise<GamificationState> {
        const state = await readState();
        if (state.rewardedMatchIds.includes(matchId)) return state;

        const streak = updateStreak(state, dateKey(now));
        const updated: GamificationState = {
            ...state,
            ...streak,
            totalXp: state.totalXp + amount,
            rewardedMatchIds: [...state.rewardedMatchIds, matchId],
        };
        await writeState(updated);
        return updated;
    },
};
