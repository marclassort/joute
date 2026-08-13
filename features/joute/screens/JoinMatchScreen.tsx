import {Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuth, useUser} from "@clerk/expo";
import {useRouter} from "expo-router";
import {joinMatch} from "@/game/engine";
import {Player} from "@/game/types";
import {localInvitationRepository} from "@/services/localInvitationRepository";
import {localMatchRepository} from "@/services/localMatchRepository";
import {PENDING_INVITE_STORAGE_KEY} from "@/services/invitations";
import {useMatches} from "../hooks/useMatches";

const SafeAreaView = styled(RNSafeAreaView);

export interface JoinMatchScreenProps {
    code: string;
}

const JoinMatchScreen = ({code}: JoinMatchScreenProps) => {
    const router = useRouter();
    const {isLoaded: authLoaded, isSignedIn} = useAuth();
    const {user} = useUser();
    const {saveMatch} = useMatches();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function join() {
            if (!authLoaded) return;

            if (!isSignedIn) {
                await AsyncStorage.setItem(PENDING_INVITE_STORAGE_KEY, code);
                router.replace("/(auth)/sign-in");
                return;
            }

            const myId = user?.id ?? "";
            const invitation = await localInvitationRepository.getByCode(code);

            if (!invitation) {
                if (!cancelled) setErrorMessage("Ce lien d'invitation n'est plus valide.");
                return;
            }
            if (invitation.usedByPlayerId) {
                if (!cancelled) setErrorMessage("Ce lien a déjà été utilisé.");
                return;
            }
            if (invitation.creatorId === myId) {
                if (!cancelled) setErrorMessage("Tu ne peux pas rejoindre ta propre invitation.");
                return;
            }

            const match = await localMatchRepository.get(invitation.matchId);
            if (!match) {
                if (!cancelled) setErrorMessage("La partie associée à cette invitation est introuvable.");
                return;
            }

            const me: Player = {
                id: myId,
                displayName: user?.firstName || user?.username || user?.primaryEmailAddress?.emailAddress || "Moi",
                avatarUrl: user?.imageUrl ?? null,
                isGhost: false,
            };

            try {
                const joined = joinMatch({match, player: me});
                await saveMatch(joined);
                await localInvitationRepository.markUsed(code, myId);
                if (!cancelled) router.replace(`/joute/${joined.id}`);
            } catch (error) {
                if (!cancelled) {
                    setErrorMessage(error instanceof Error ? error.message : "Impossible de rejoindre cette partie.");
                }
            }
        }

        join();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authLoaded, isSignedIn, code]);

    if (errorMessage) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center gap-2 bg-plateau-cream p-5">
                <Text className="joute-step-title">Invitation invalide</Text>
                <Text className="home-empty-state">{errorMessage}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-plateau-cream p-5">
            <View className="joute-skeleton" />
        </SafeAreaView>
    );
};

export default JoinMatchScreen;
