import {Text, View} from "react-native";
import React, {useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {useUser} from "@clerk/expo";
import {AVATAR_OPTIONS} from "@/game/avatars";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

const SignAvatarScreen = () => {
    const router = useRouter();
    const {user} = useUser();
    const [selectedId, setSelectedId] = useState(AVATAR_OPTIONS[0].id);
    const [isSaving, setIsSaving] = useState(false);

    const selected = AVATAR_OPTIONS.find((option) => option.id === selectedId) ?? AVATAR_OPTIONS[0];

    const handleContinue = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await user.updateMetadata({unsafeMetadata: {avatarId: selectedId}});
            router.push("/profile-setup/photo");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[18px]">
            <View className="flex-1 gap-4 px-[18px] pb-6">
                <View className="profile-setup-progress-row">
                    <Text className="text-eyebrow text-plateau-ink/45">Étape 2 sur 3</Text>
                    <Text className="profile-setup-progress-pct">65 %</Text>
                </View>
                <View className="profile-setup-progress-track">
                    <View className="profile-setup-progress-fill" style={{width: "65%"}} />
                </View>

                <Text className="text-hero-title text-plateau-ink">Choisis{"\n"}ton avatar</Text>

                <View className="profile-setup-avatar-preview" style={{backgroundColor: selected.bg}}>
                    <Text className="profile-setup-avatar-preview-glyph">{selected.glyph}</Text>
                </View>

                <View className="profile-setup-avatar-grid">
                    {AVATAR_OPTIONS.map((option) => {
                        const isSelected = option.id === selectedId;
                        return (
                            <PressableScale
                                key={option.id}
                                className="profile-setup-avatar-cell"
                                style={{
                                    backgroundColor: `${option.bg}29`,
                                    borderWidth: isSelected ? 2 : 0,
                                    borderColor: "#14121F",
                                }}
                                onPress={() => setSelectedId(option.id)}
                                accessibilityRole="button"
                                accessibilityState={{selected: isSelected}}
                            >
                                <Text className="profile-setup-avatar-cell-glyph">{option.glyph}</Text>
                            </PressableScale>
                        );
                    })}
                </View>

                <View className="flex-1" />

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

export default SignAvatarScreen;
