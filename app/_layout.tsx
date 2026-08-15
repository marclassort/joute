import {SplashScreen, Stack, useRouter} from "expo-router";
import "@/global.css"
import {useFonts} from "expo-font";
import {useEffect} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ClerkProvider, useAuth} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";
import {frFR} from "@clerk/localizations";
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
    'sans-light': require("@/assets/fonts/InstrumentSans-Regular.ttf"),
    'sans-regular': require("@/assets/fonts/InstrumentSans-Regular.ttf"),
    'sans-medium': require("@/assets/fonts/InstrumentSans-Medium.ttf"),
    'sans-semibold': require("@/assets/fonts/InstrumentSans-SemiBold.ttf"),
    'sans-bold': require("@/assets/fonts/InstrumentSans-Bold.ttf"),
    'sans-extrabold': require("@/assets/fonts/InstrumentSans-Bold.ttf"),
    'display-extrabold': require("@/assets/fonts/BricolageGrotesque-ExtraBold.ttf"),
  });
  const { isLoaded: authLoaded, isSignedIn } = useAuth();

  const ready = fontsLoaded && authLoaded;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync()
    }
  }, [ready])

  // Les effets sonores du jeu doivent s'entendre même quand l'appareil est en mode silencieux (comportement standard des jeux mobiles).
  // Import dynamique : si le module natif ExpoAudio est absent de ce build (certains builds Expo Go),
  // un import statique ferait planter TOUTE l'app au chargement — le dynamique rend l'échec capturable.
  useEffect(() => {
    import("expo-audio")
      .then(({setAudioModeAsync}) => setAudioModeAsync({playsInSilentMode: true}))
      .catch(() => {
        // Ignoré volontairement — un effet sonore n'est jamais un chemin critique.
      });
  }, []);

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

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
      <Stack.Screen name="solo/index" options={{ animation: "fade" }} />
      <Stack.Screen name="streak/index" options={{ animation: "fade" }} />
      <Stack.Screen name="plateau/new" options={{ animation: "fade" }} />
      <Stack.Screen name="duel/lobby" options={{ animation: "fade" }} />
      <Stack.Screen name="profile-modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} localization={frFR}>
      <MatchesProvider>
        <PlateauMatchesProvider>
          <RootNavigator />
        </PlateauMatchesProvider>
      </MatchesProvider>
    </ClerkProvider>
  );
}
