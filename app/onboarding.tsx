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
        router.replace("/(tabs)/joute");
    };

    return (
        <SafeAreaView className="flex-1 items-center justify-center bg-background p-5">
            <View className="auth-logo-wrap">
                <View className="auth-logo-mark">
                    <Text className="auth-logo-mark-text">J</Text>
                </View>
                <View>
                    <Text className="auth-wordmark">Joute</Text>
                    <Text className="auth-wordmark-sub">Duels de culture générale</Text>
                </View>
            </View>

            <Text className="auth-title mt-8 text-center">Défie tes amis en duel</Text>
            <Text className="auth-subtitle">
                8 manches, 24 questions, un ami ou un profil de démonstration. Réponds le plus vite et le plus juste possible.
            </Text>

            <View className="mt-10 w-full gap-3">
                <Pressable className="joute-new-match-button" onPress={handleSignIn} accessibilityRole="button">
                    <Text className="joute-new-match-text">Se connecter</Text>
                </Pressable>
                <Pressable className="auth-secondary-button" onPress={handleGuest} accessibilityRole="button">
                    <Text className="auth-secondary-button-text">Continuer sans compte</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default Onboarding;
