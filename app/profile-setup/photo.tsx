import {Image, Pressable, Text, View} from "react-native";
import React, {useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {useUser} from "@clerk/expo";
import * as ImagePicker from "expo-image-picker";
import {clearNeedsProfileSetup} from "@/services/guestIdentity";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

const SignPhotoScreen = () => {
    const router = useRouter();
    const {user} = useUser();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [pendingBase64, setPendingBase64] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handlePickPhoto = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            setError("Autorise l'accès à tes photos pour ajouter une photo de profil.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        const asset = result.assets?.[0];
        if (result.canceled || !asset?.base64) return;

        setError(null);
        setPhotoUri(asset.uri);
        setPendingBase64(asset.base64);
    };

    const finish = async () => {
        await clearNeedsProfileSetup();
        router.replace("/(tabs)");
    };

    const handleFinish = async () => {
        if (!user || !pendingBase64) {
            await finish();
            return;
        }

        setIsSaving(true);
        try {
            await user.setProfileImage({file: `data:image/jpeg;base64,${pendingBase64}`});
            await finish();
        } catch {
            setError("Impossible d'enregistrer la photo. Réessaie ou passe cette étape.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[18px]">
            <View className="flex-1 gap-4 px-[18px] pb-6">
                <View className="profile-setup-progress-row">
                    <Text className="text-eyebrow text-plateau-ink/45">Étape 3 sur 3</Text>
                    <Text className="profile-setup-progress-pct">85 %</Text>
                </View>
                <View className="profile-setup-progress-track">
                    <View className="profile-setup-progress-fill" style={{width: "85%"}} />
                </View>

                <Text className="text-hero-title text-plateau-ink">Mets un visage{"\n"}sur ton pseudo</Text>

                <Pressable className="profile-setup-photo-drop" onPress={handlePickPhoto} accessibilityRole="button">
                    {photoUri ? (
                        <Image source={{uri: photoUri}} className="profile-setup-photo-preview" />
                    ) : (
                        <>
                            <View className="profile-setup-photo-plus">
                                <Text className="profile-setup-photo-plus-text">＋</Text>
                            </View>
                            <Text className="profile-setup-photo-label">Ajouter une photo</Text>
                            <Text className="profile-setup-photo-hint">photo de profil · carré, 512 px min.</Text>
                        </>
                    )}
                </Pressable>

                {error && <Text className="session-error">{error}</Text>}

                <View className="profile-setup-reward-banner">
                    <Text className="text-[19px]">🎁</Text>
                    <Text className="profile-setup-reward-text">+50 jetons et le badge « Éclair doré » dès que ta photo est en place.</Text>
                </View>

                <View className="flex-1" />

                <PressableScale
                    activeScale={0.98}
                    className="premium-cta-button"
                    onPress={handleFinish}
                    disabled={isSaving}
                    accessibilityRole="button"
                >
                    <Text className="premium-cta-text">{isSaving ? "…" : "Commencer à jouer"}</Text>
                </PressableScale>
                <Pressable onPress={finish} accessibilityRole="button">
                    <Text className="profile-setup-skip">Plus tard</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
};

export default SignPhotoScreen;
