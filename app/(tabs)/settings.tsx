import { Pressable, Text } from "react-native";
import { useState } from "react";
import { styled } from "nativewind";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import { useAuth } from "@clerk/expo";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const { signOut } = useAuth();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } finally {
            setIsSigningOut(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="settings-title">Paramètres</Text>

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
        </SafeAreaView>
    );
};

export default Settings;
