import "@/global.css"
import { Text } from "react-native";
import {Link} from "expo-router";
import { styled } from "nativewind";
import {SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

export default function App() {
    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="text-7xl font-sans-extrabold text-primary">
                Accueil
            </Text>
            <Link href="/onboarding" className="mt-4 font-sans-bold rounded bg-primary text-white p-4">
                Onboarding
            </Link>
            <Link href="/(auth)/sign-up" className="mt-4 font-sans-bold rounded bg-primary text-white p-4">
                M&#39;inscrire
            </Link>
            <Link href="/(auth)/sign-in" className="mt-4 font-sans-bold rounded bg-primary text-white p-4">
                Me connecter
            </Link>
        </SafeAreaView>
    );
}