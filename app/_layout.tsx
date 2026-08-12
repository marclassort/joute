import {SplashScreen, Stack, useRouter} from "expo-router";
import "@/global.css"
import {useFonts} from "expo-font";
import {useEffect} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ClerkProvider, useAuth} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {frFR} from "@clerk/localizations";
import {SubscriptionsProvider} from "@/context/SubscriptionsContext";
import {MatchesProvider} from "@/features/joute/context/MatchesContext";
import {PlateauMatchesProvider} from "@/features/plateau/context/PlateauMatchesContext";
import {PENDING_INVITE_STORAGE_KEY} from "@/services/invitations";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

function RootNavigator() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'sans-regular': require("@/assets/fonts/PlusJakartaSans-Regular.ttf"),
    'sans-bold': require("@/assets/fonts/PlusJakartaSans-Bold.ttf"),
    'sans-medium': require("@/assets/fonts/PlusJakartaSans-Medium.ttf"),
    'sans-semibold': require("@/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    'sans-extrabold': require("@/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    'sans-light': require("@/assets/fonts/PlusJakartaSans-Light.ttf"),
    'archivo-extrabold': require("@/assets/fonts/Archivo-ExtraBold.ttf"),
  });
  const { isLoaded: authLoaded, isSignedIn } = useAuth();

  const ready = fontsLoaded && authLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  // Reprend une invitation mémorisée avant le passage par la connexion (§4.2 : le code doit survivre à l'authentification).
  useEffect(() => {
    if (!ready || !isSignedIn) return;

    AsyncStorage.getItem(PENDING_INVITE_STORAGE_KEY).then((code) => {
      if (!code) return;
      AsyncStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
      router.replace(`/match/${code}`);
    });
  }, [ready, isSignedIn, router])

  if (!ready) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} localization={frFR}>
      <SubscriptionsProvider>
        <MatchesProvider>
          <PlateauMatchesProvider>
            <RootNavigator />
          </PlateauMatchesProvider>
        </MatchesProvider>
      </SubscriptionsProvider>
    </ClerkProvider>
  );
}
