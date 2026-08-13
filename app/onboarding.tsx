import {Pressable, Text, View} from "react-native";
import React from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {markOnboardingSeen} from "@/services/guestIdentity";

const SafeAreaView = styled(RNSafeAreaView);

const Onboarding = () => {
    const router = useRouter();

    const handleSignIn = async () => {
        await markOnboardingSeen();
        router.replace("/(auth)/sign-in");
    };

    const handleGuest = async () => {
        await markOnboardingSeen();
        router.replace("/(tabs)");
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-plateau-cream p-5">
            <View className="session-logo-wrap">
                <View className="session-logo-mark">
                    <Text className="session-logo-mark-text">J</Text>
                </View>
                <View>
                    <Text className="session-wordmark">Joute</Text>
                    <Text className="session-wordmark-sub">Duels de culture générale</Text>
                </View>
            </View>

            <Text className="session-title mt-8 text-center">Défie tes amis en duel</Text>
            <Text className="session-subtitle">
                8 manches, 24 questions, un ami ou un profil de démonstration. Réponds le plus vite et le plus juste possible.
            </Text>

            <View className="mt-10 w-full gap-3">
                <Pressable className="joute-new-match-button" onPress={handleSignIn} accessibilityRole="button">
                    <Text className="joute-new-match-text">Se connecter</Text>
                </Pressable>
                <Pressable className="session-secondary-button" onPress={handleGuest} accessibilityRole="button">
                    <Text className="session-secondary-text">Continuer sans compte</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default Onboarding;
