import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import "@/global.css"
import { hasSeenOnboarding } from "@/services/guestIdentity";

export default function AuthRoutesLayout() {
    const { isSignedIn } = useAuth();
    const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

    useEffect(() => {
        hasSeenOnboarding().then(setOnboardingSeen);
    }, []);

    if (isSignedIn) {
        return <Redirect href="/(tabs)" />;
    }

    if (onboardingSeen === null) return null;

    if (!onboardingSeen) {
        return <Redirect href="/onboarding" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
