import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {Category} from "@/game/types";
import {localSoloStatsRepository, SoloStats} from "@/services/localSoloStatsRepository";

/** Statistiques solo par thème, rechargées à chaque fois que l'écran reprend le focus (ex. retour depuis une partie). */
export function useSoloStats() {
    const [stats, setStats] = useState<SoloStats>({});
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        const loaded = await localSoloStatsRepository.getAll();
        setStats(loaded);
        setIsLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    const recordSession = useCallback(async (category: Category, correct: number, total: number) => {
        const updated = await localSoloStatsRepository.recordSession(category, correct, total);
        setStats(updated);
    }, []);

    return {stats, isLoading, refresh, recordSession};
}
