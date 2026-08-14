import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import "@/global.css"
import { hasSeenOnboarding, needsProfileSetup } from "@/services/guestIdentity";

export default function AuthRoutesLayout() {
    const { isSignedIn } = useAuth();
    const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
    const [profileSetupPending, setProfileSetupPending] = useState<boolean | null>(null);

    useEffect(() => {
        hasSeenOnboarding().then(setOnboardingSeen);
        needsProfileSetup().then(setProfileSetupPending);
    }, []);

    if (isSignedIn) {
        if (profileSetupPending === null) return null;
        if (profileSetupPending) return <Redirect href="/profile-setup/nickname" />;
        return <Redirect href="/(tabs)" />;
    }

    if (onboardingSeen === null) return null;

    if (!onboardingSeen) {
        return <Redirect href="/onboarding" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
