import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {localQuestRepository, QuestStats} from "@/services/localQuestRepository";

const EMPTY_STATS: QuestStats = {fastAnswers: 0};

/** Statistiques de quêtes, rechargées à chaque fois que l'écran reprend le focus (ex. retour d'une partie). */
export function useQuestStats() {
    const [stats, setStats] = useState<QuestStats>(EMPTY_STATS);

    const refresh = useCallback(async () => {
        setStats(await localQuestRepository.get());
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    return {...stats, refresh};
}
