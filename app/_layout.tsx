import {SplashScreen, Stack} from "expo-router";
import "@/global.css"
import {useFonts} from "expo-font";
import {useEffect} from "react";
import {ClerkProvider, useAuth} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {frFR} from "@clerk/localizations";
import {SubscriptionsProvider} from "@/context/SubscriptionsContext";
import {MatchesProvider} from "@/features/joute/context/MatchesContext";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

function RootNavigator() {
  const [fontsLoaded] = useFonts({
    'sans-regular': require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    'sans-bold': require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
    'sans-medium': require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    'sans-semibold': require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    'sans-extrabold': require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    'sans-light': require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
  });
  const { isLoaded: authLoaded } = useAuth();

  const ready = fontsLoaded && authLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  if (!ready) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} localization={frFR}>
      <SubscriptionsProvider>
        <MatchesProvider>
          <RootNavigator />
        </MatchesProvider>
      </SubscriptionsProvider>
    </ClerkProvider>
  );
}
