import {Pressable, Text, View} from "react-native";
import React, {useState} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {useAuth} from "@clerk/expo";
import {createOneWinnerGame} from "@/lib/oneWinnerApi";
import ShadowCard from "@/components/ShadowCard";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

const OneWinnerIntroScreen = () => {
    const router = useRouter();
    const {isSignedIn, getToken} = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setError(null);
        setIsCreating(true);
        try {
            const token = await getToken();
            if (!token) throw new Error("Non connecté");
            const {id} = await createOneWinnerGame(token);
            router.replace(`/one-winner/${id}`);
        } catch (caughtError) {
            setError((caughtError as Error).message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <View className="duel-header">
                <Pressable className="duel-close-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <Text className="duel-header-title">Un seul gagnant</Text>
                <View className="size-9" />
            </View>

            <View className="mt-5">
                <Text className="solo-hero-title text-plateau-paper">Un seul{"\n"}gagnant</Text>
                <Text className="solo-hero-subtitle text-plateau-paper/60">
                    4 à 6 joueurs, plusieurs manches, éliminations en direct — un seul survivant remporte la partie.
                </Text>
            </View>

            <View className="mt-6 gap-3">
                <ShadowCard borderRadius={18} className="duel-category-card">
                    <Text className="duel-category-icon">⚡</Text>
                    <Text className="duel-category-label">Le Défi · questions simultanées, la vitesse paie</Text>
                </ShadowCard>
                <ShadowCard borderRadius={18} className="duel-category-card">
                    <Text className="duel-category-icon">🔔</Text>
                    <Text className="duel-category-label">Le Buzzer · premier arrivé, premier à répondre</Text>
                </ShadowCard>
                <ShadowCard borderRadius={18} className="duel-category-card">
                    <Text className="duel-category-icon">🎲</Text>
                    <Text className="duel-category-label">La Conquête · misez vos points, tout ou rien</Text>
                </ShadowCard>
            </View>

            <View className="mt-auto gap-3">
                {error && <Text className="session-error text-center">{error}</Text>}
                {isSignedIn ? (
                    <ShadowCard borderRadius={20} className={isCreating ? "solo-cta-button opacity-50" : "solo-cta-button"}>
                        <PressableScale activeScale={0.98} onPress={handleCreate} disabled={isCreating} accessibilityRole="button">
                            <Text className="solo-cta-text">{isCreating ? "Création…" : "Créer une partie"}</Text>
                        </PressableScale>
                    </ShadowCard>
                ) : (
                    <>
                        <Text className="home-empty-state text-plateau-paper/60 text-center">
                            Un compte est nécessaire pour jouer en multijoueur temps réel.
                        </Text>
                        <ShadowCard borderRadius={20} className="solo-cta-button">
                            <PressableScale activeScale={0.98} onPress={() => router.push("/(auth)/sign-up")} accessibilityRole="button">
                                <Text className="solo-cta-text">Créer un compte</Text>
                            </PressableScale>
                        </ShadowCard>
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

export default OneWinnerIntroScreen;
