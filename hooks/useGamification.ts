import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {localGamificationRepository, GamificationState} from "@/services/localGamificationRepository";

const EMPTY_STATE: GamificationState = {
    totalXp: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: null,
    rewardedMatchIds: [],
};

/** État XP/niveau/série, rechargé à chaque fois que l'écran reprend le focus (ex. retour d'une partie qui vient de créditer de l'XP). */
export function useGamification() {
    const [state, setState] = useState<GamificationState>(EMPTY_STATE);

    const refresh = useCallback(async () => {
        setState(await localGamificationRepository.get());
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    return {...state, refresh};
}
