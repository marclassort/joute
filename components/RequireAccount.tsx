import {Pressable, Text} from "react-native";
import React, {ReactNode} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useAuth} from "@clerk/expo";
import {useRouter} from "expo-router";

const SafeAreaView = styled(RNSafeAreaView);

export interface RequireAccountProps {
    children: ReactNode;
}

const RequireAccount = ({children}: RequireAccountProps) => {
    const {isSignedIn} = useAuth();
    const router = useRouter();

    if (isSignedIn) return <>{children}</>;

    return (
        <SafeAreaView className="flex-1 items-center justify-center gap-4 bg-background p-5">
            <Text className="joute-step-title">Connecte-toi pour continuer</Text>
            <Text className="home-empty-state">Cette section nécessite un compte.</Text>
            <Pressable className="joute-new-match-button" onPress={() => router.push("/(auth)/sign-in")} accessibilityRole="button">
                <Text className="joute-new-match-text">Se connecter</Text>
            </Pressable>
        </SafeAreaView>
    );
};

export default RequireAccount;
