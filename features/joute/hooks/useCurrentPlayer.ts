import {useEffect, useState} from "react";
import {useUser} from "@clerk/expo";
import {getOrCreateGuestId, getOrCreateGuestName} from "@/services/guestIdentity";

export interface CurrentPlayer {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    isGuest: boolean;
    /** false tant que l'identité (Clerk ou invité) n'est pas encore résolue. */
    isReady: boolean;
}

/** Identité du joueur courant pour les écrans Joute : un compte Clerk s'il est connecté, sinon une identité locale d'invité persistée sur l'appareil. */
export function useCurrentPlayer(): CurrentPlayer {
    const {user, isLoaded} = useUser();
    const [guestId, setGuestId] = useState<string | null>(null);
    const [guestName, setGuestName] = useState<string | null>(null);

    useEffect(() => {
        if (user) return;
        getOrCreateGuestId().then(setGuestId);
        getOrCreateGuestName().then(setGuestName);
    }, [user]);

    if (user) {
        return {
            id: user.id,
            displayName: user.firstName || user.username || user.primaryEmailAddress?.emailAddress || "Moi",
            avatarUrl: user.imageUrl ?? null,
            isGuest: false,
            isReady: true,
        };
    }

    return {
        id: guestId ?? "",
        // Un nom distinctif (pas juste "Invité") pour rester reconnaissable au milieu d'autres invités
        // dans une même partie multijoueur temps réel — voir services/guestIdentity.ts.
        displayName: guestName ?? "Invité",
        avatarUrl: null,
        isGuest: true,
        isReady: isLoaded && guestId !== null && guestName !== null,
    };
}
