import {useCallback, useEffect, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {useAuth, useUser} from "@clerk/expo";
import {localGamificationRepository, GamificationState} from "@/services/localGamificationRepository";
import {submitScore} from "@/lib/api";

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
    const {isSignedIn, getToken} = useAuth();
    const {user} = useUser();

    const refresh = useCallback(async () => {
        setState(await localGamificationRepository.get());
    }, []);

    useFocusEffect(
        useCallback(() => {
            refresh();
        }, [refresh]),
    );

    // Pousse l'XP courante vers le classement mondial dès qu'elle change, uniquement pour les joueurs connectés
    // (un invité n'a pas de userId Clerk stable à associer à une ligne du classement). Best-effort : ne doit
    // jamais bloquer ni faire planter l'écran si le backend est injoignable ou pas encore configuré.
    useEffect(() => {
        if (!isSignedIn || !user) return;

        const displayName = user.firstName || user.username || user.primaryEmailAddress?.emailAddress || "Joueur";

        getToken()
            .then((token) => {
                if (!token) return;
                return submitScore(token, {totalXp: state.totalXp, displayName, avatarUrl: user.imageUrl ?? null});
            })
            .catch(() => {
                // Ignoré volontairement — voir le commentaire ci-dessus.
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.totalXp, isSignedIn]);

    return {...state, refresh};
}
