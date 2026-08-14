import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { formatSubscriptionDateTime } from "@/lib/utils";
import { plateauColors } from "@/constants/theme";
import { useAppSettings } from "@/hooks/useAppSettings";
import { usePremium } from "@/hooks/usePremium";
import EditProfileModal from "@/components/EditProfileModal";

const SafeAreaView = styled(RNSafeAreaView);

const ToggleRow = ({
    icon,
    label,
    hint,
    value,
    onToggle,
    withDivider,
}: {
    icon: string;
    label: string;
    hint: string;
    value: boolean;
    onToggle: () => void;
    withDivider?: boolean;
}) => (
    <Pressable
        className={clsx("settings-row", withDivider && "settings-row-divider")}
        onPress={onToggle}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
    >
        <Text className="settings-row-icon">{icon}</Text>
        <View className="settings-row-copy">
            <Text className="settings-row-label">{label}</Text>
            <Text className="settings-row-hint">{hint}</Text>
        </View>
        <View
            className="settings-toggle-track"
            style={{
                backgroundColor: value ? plateauColors.teal : "rgba(20,18,31,0.14)",
                alignItems: value ? "flex-end" : "flex-start",
            }}
        >
            <View className="settings-toggle-knob" />
        </View>
    </Pressable>
);

const Settings = () => {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isEditProfileVisible, setEditProfileVisible] = useState(false);
    const { soundEnabled, hapticsEnabled, toggleSound, toggleHaptics } = useAppSettings();
    const { isPremium } = usePremium();

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } finally {
            setIsSigningOut(false);
        }
    };

    const soundsCard = (
        <View className="gap-1">
            <Text className="settings-card-label">Sons & vibrations</Text>
            <View className="settings-card">
                <ToggleRow icon="🔊" label="Effets sonores" hint="Bonne/mauvaise réponse, victoire" value={soundEnabled} onToggle={toggleSound} withDivider />
                <ToggleRow icon="📳" label="Vibrations" hint="Retour haptique pendant les parties" value={hapticsEnabled} onToggle={toggleHaptics} />
            </View>
        </View>
    );

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-paper p-5">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                    <Text className="settings-title">Paramètres</Text>
                    {soundsCard}
                    <View className="gap-1">
                        <Text className="settings-card-label">Profil</Text>
                        <View className="settings-card">
                            <Text className="home-empty-state">
                                Tu utilises Joute sans compte. Connecte-toi pour sauvegarder ta progression et gérer ton profil.
                            </Text>
                            <Pressable className="joute-new-match-button mt-4" onPress={() => router.push("/(auth)/sign-in")} accessibilityRole="button">
                                <Text className="joute-new-match-text">Se connecter</Text>
                            </Pressable>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    const avatarUri = user.imageUrl;
    const name = user.fullName || "Compte Joute";
    const email = user.primaryEmailAddress?.emailAddress ?? "Non renseigné";
    const accountId = user.id;
    const joinedAt = formatSubscriptionDateTime(user.createdAt?.toISOString());

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper p-5">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="gap-6 pb-10"
            >
                <Text className="settings-title">Paramètres</Text>

                <View className="gap-1">
                    <View className="mb-1 flex-row items-center justify-between">
                        <Text className="settings-card-label">Profil</Text>
                        <Pressable className="list-action" onPress={() => setEditProfileVisible(true)}>
                            <Text className="list-action-text">Modifier</Text>
                        </Pressable>
                    </View>
                    <View className="settings-card">
                        <View className="settings-profile-row">
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} className="settings-avatar" />
                            ) : (
                                <View className="settings-avatar bg-plateau-iris" />
                            )}
                            <View className="settings-profile-copy">
                                <Text className="settings-profile-name" numberOfLines={1}>
                                    {name}
                                </Text>
                                <Text className="settings-profile-email" numberOfLines={1}>
                                    {email}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {soundsCard}

                <View className="gap-1">
                    <Text className="settings-card-label">Compte</Text>
                    <View className="settings-card">
                        <Pressable
                            className="settings-row settings-row-divider"
                            onPress={() => router.push("/premium")}
                            accessibilityRole="button"
                        >
                            <Text className="settings-row-icon">👑</Text>
                            <Text className="settings-row-label flex-1">Abonnement</Text>
                            <Text className="settings-row-value" style={{color: isPremium ? plateauColors.teal : plateauColors.coral}}>
                                {isPremium ? "Actif" : "Non abonné"}
                            </Text>
                            <Text className="settings-row-chevron">›</Text>
                        </Pressable>
                        <View className="settings-row">
                            <Text className="settings-row-icon">🪪</Text>
                            <View className="settings-row-copy">
                                <Text className="settings-row-label">Identifiant</Text>
                                <Text className="settings-row-hint" numberOfLines={1} ellipsizeMode="tail">
                                    {accountId}
                                </Text>
                            </View>
                        </View>
                        <View className="settings-row settings-row-divider">
                            <Text className="settings-row-icon">📅</Text>
                            <Text className="settings-row-label flex-1">Membre depuis</Text>
                            <Text className="settings-row-value">{joinedAt}</Text>
                        </View>
                    </View>
                </View>

                <Pressable
                    className={clsx(
                        "settings-signout-button",
                        isSigningOut && "settings-signout-button-disabled",
                    )}
                    onPress={handleSignOut}
                    disabled={isSigningOut}
                >
                    <Text className="settings-signout-text">
                        {isSigningOut ? "Déconnexion…" : "Se déconnecter"}
                    </Text>
                </Pressable>
            </ScrollView>

            <EditProfileModal
                visible={isEditProfileVisible}
                onClose={() => setEditProfileVisible(false)}
            />
        </SafeAreaView>
    );
};

export default Settings;
