import {Pressable, Text, View} from "react-native";
import React from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {markOnboardingSeen} from "@/services/guestIdentity";
import InkPattern from "@/components/InkPattern";

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
        <SafeAreaView className="flex-1 bg-plateau-ink px-[22px] pb-[26px] pt-[18px]">
            <View className="relative flex-1 overflow-hidden">
                <InkPattern />
                <View className="hub-hero-blob" />

                <View className="welcome-header">
                    <View className="welcome-logo-badge">
                        <Text className="welcome-logo-text">J</Text>
                    </View>
                    <Text className="welcome-wordmark">Joute</Text>
                </View>

                <View className="flex-1 justify-center gap-5">
                    <View className="welcome-tiles-row">
                        <View className="welcome-tile bg-plateau-teal">
                            <Text className="text-[32px]">🌍</Text>
                        </View>
                        <View className="welcome-tile bg-plateau-iris">
                            <Text className="text-[32px]">🧩</Text>
                        </View>
                        <View className="welcome-tile bg-plateau-brass">
                            <Text className="text-[32px]">🏛️</Text>
                        </View>
                    </View>

                    <Text className="welcome-title">Le quiz{"\n"}qui se joue{"\n"}à plusieurs.</Text>
                    <Text className="welcome-subtitle">
                        Duels, plateaux à 6 joueurs, séries sans fin. Réponds le plus vite et le plus juste possible.
                    </Text>
                </View>

                <View className="welcome-actions">
                    <Pressable className="welcome-cta" onPress={handleSignIn} accessibilityRole="button">
                        <Text className="welcome-cta-text">Créer mon profil</Text>
                    </Pressable>
                    <Pressable className="welcome-secondary" onPress={handleGuest} accessibilityRole="button">
                        <Text className="welcome-secondary-text">Jouer sans compte</Text>
                    </Pressable>
                    <Text className="welcome-caption">Aucune donnée demandée pour la première partie.</Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Onboarding;
