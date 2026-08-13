import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {localStreakStatsRepository} from "@/services/localStreakStatsRepository";

export function useStreakStats() {
    const [bestStreak, setBestStreak] = useState(0);

    const refresh = useCallback(async () => {
        const stats = await localStreakStatsRepository.get();
        setBestStreak(stats.bestStreak);
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    return {bestStreak, refresh};
}
