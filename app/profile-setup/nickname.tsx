import {Pressable, ScrollView, Text, View} from "react-native";
import React, {useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {useUser} from "@clerk/expo";
import {generateNickname, generateNicknameSuggestions} from "@/game/nickname";
import ShadowCard from "@/components/ShadowCard";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

const SignNicknameScreen = () => {
    const router = useRouter();
    const {user} = useUser();
    const [nickname, setNickname] = useState(() => generateNickname());
    const [suggestions] = useState(() => generateNicknameSuggestions());
    const [isSaving, setIsSaving] = useState(false);

    const handleContinue = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await user.update({firstName: nickname});
            router.push("/profile-setup/avatar");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[18px]">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-4 px-[18px] pb-6">
                <View className="profile-setup-progress-row">
                    <Text className="text-eyebrow text-plateau-ink/45">Étape 1 sur 3</Text>
                    <Text className="profile-setup-progress-pct">40 %</Text>
                </View>
                <View className="profile-setup-progress-track">
                    <View className="profile-setup-progress-fill" style={{width: "40%"}} />
                </View>

                <Text className="text-hero-title text-plateau-ink">On t&#39;a choisi{"\n"}un pseudo</Text>
                <Text className="profile-setup-subtitle">
                    Garde-le et joue tout de suite, ou personnalise-le : les joueurs au pseudo choisi reçoivent 30 % de défis en plus.
                </Text>

                <ShadowCard borderRadius={22} className="profile-setup-nick-card">
                    <View className="gap-[2px]">
                        <Text className="text-eyebrow text-plateau-ink/45">Pseudo</Text>
                        <Text className="profile-setup-nick-value">{nickname}</Text>
                    </View>
                    <View className="profile-setup-nick-available">
                        <Text className="profile-setup-nick-available-text">Disponible</Text>
                    </View>
                </ShadowCard>

                <View className="profile-setup-chip-row">
                    {suggestions.map((suggestion) => (
                        <Pressable
                            key={suggestion}
                            className="profile-setup-chip"
                            onPress={() => setNickname(suggestion)}
                            accessibilityRole="button"
                        >
                            <Text className="profile-setup-chip-text">{suggestion}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <View className="px-[18px] pb-6">
                <PressableScale
                    activeScale={0.98}
                    className="premium-cta-button"
                    onPress={handleContinue}
                    disabled={isSaving}
                    accessibilityRole="button"
                >
                    <Text className="premium-cta-text">{isSaving ? "…" : "Continuer"}</Text>
                </PressableScale>
            </View>
        </SafeAreaView>
    );
};

export default SignNicknameScreen;
