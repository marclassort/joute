import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useState } from "react";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import { useAuth, useUser } from "@clerk/expo";
import { formatSubscriptionDateTime } from "@/lib/utils";
import EditProfileModal from "@/components/EditProfileModal";
import RequireAccount from "@/components/RequireAccount";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const { signOut } = useAuth();
    const { user } = useUser();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isEditProfileVisible, setEditProfileVisible] = useState(false);

    const avatarUri = user?.imageUrl;
    const name = user?.fullName || "Compte Joute";
    const email = user?.primaryEmailAddress?.emailAddress ?? "Non renseigné";
    const accountId = user?.id ?? "Non renseigné";
    const joinedAt = formatSubscriptionDateTime(user?.createdAt?.toISOString());

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <RequireAccount>
        <SafeAreaView className="flex-1 bg-background p-5">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="gap-6 pb-10"
            >
                <Text className="settings-title">Paramètres</Text>

                <View className="settings-card">
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-xs font-sans-semibold uppercase tracking-[1px] text-muted-foreground">
                            Profil
                        </Text>
                        <Pressable className="list-action" onPress={() => setEditProfileVisible(true)}>
                            <Text className="list-action-text">Modifier</Text>
                        </Pressable>
                    </View>
                    <View className="settings-profile-row">
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} className="settings-avatar" />
                        ) : (
                            <View className="settings-avatar bg-muted" />
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

                <View className="settings-card">
                    <Text className="settings-card-label">Compte</Text>
                    <View className="sub-details">
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Identifiant :</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {accountId}
                                </Text>
                            </View>
                        </View>
                        <View className="sub-row">
                            <View className="sub-row-copy">
                                <Text className="sub-label">Membre depuis :</Text>
                                <Text className="sub-value" numberOfLines={1} ellipsizeMode="tail">
                                    {joinedAt}
                                </Text>
                            </View>
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
        </RequireAccount>
    );
};

export default Settings;
