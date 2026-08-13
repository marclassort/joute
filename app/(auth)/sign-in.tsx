import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { Link, useRouter } from "expo-router";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import { plateauColors } from "@/constants/theme";
import { isValidEmail } from "@/lib/utils";
import { markOnboardingSeen } from "@/services/guestIdentity";
import HardShadowCard from "@/features/joute/components/HardShadowCard";

WebBrowser.maybeCompleteAuthSession();

const SafeAreaView = styled(RNSafeAreaView);

type OAuthStrategy = "oauth_apple" | "oauth_google";

const SignIn = () => {
    const { isLoaded } = useAuth();
    const { signIn } = useSignIn();
    const { startSSOFlow } = useSSO();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [oauthStrategy, setOauthStrategy] = useState<OAuthStrategy | null>(null);
    const [oauthError, setOauthError] = useState<string | null>(null);

    if (!isLoaded) {
        return (
            <SafeAreaView className="session-safe-area items-center justify-center">
                <ActivityIndicator size="large" color={plateauColors.orange} />
            </SafeAreaView>
        );
    }

    const handleSignIn = async () => {
        if (!signIn) return;

        const trimmedEmail = email.trim();
        const nextEmailError = !trimmedEmail
            ? "Entrez votre adresse e-mail."
            : !isValidEmail(trimmedEmail)
                ? "Cette adresse e-mail n'est pas valide."
                : null;
        const nextPasswordError = !password ? "Entrez votre mot de passe." : null;

        setEmailError(nextEmailError);
        setPasswordError(nextPasswordError);
        setFormError(null);

        if (nextEmailError || nextPasswordError) return;

        setIsSubmitting(true);
        try {
            const { error } = await signIn.password({ identifier: trimmedEmail, password });
            if (error) {
                setFormError(error.longMessage ?? "Adresse e-mail ou mot de passe incorrect.");
                return;
            }

            if (signIn.status === "complete") {
                await signIn.finalize();
            } else {
                setFormError("Une vérification supplémentaire est requise pour ce compte.");
            }
        } catch {
            setFormError("Impossible de vous connecter pour le moment. Réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOAuth = async (strategy: OAuthStrategy) => {
        setOauthError(null);
        setOauthStrategy(strategy);
        try {
            const redirectUrl = Linking.createURL("/(tabs)");
            const { createdSessionId, setActive } = await startSSOFlow({ strategy, redirectUrl });
            if (createdSessionId && setActive) {
                await setActive({ session: createdSessionId });
            }
        } catch {
            setOauthError("Impossible de se connecter pour le moment. Réessayez.");
        } finally {
            setOauthStrategy(null);
        }
    };

    return (
        <SafeAreaView className="session-safe-area">
            <KeyboardAvoidingView
                className="session-screen"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    className="session-scroll"
                    contentContainerClassName="session-content"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="session-brand-block">
                        <View className="session-logo-wrap">
                            <View className="session-logo-mark">
                                <Text className="session-logo-mark-text">J</Text>
                            </View>
                            <View>
                                <Text className="session-wordmark">Joute</Text>
                                <Text className="session-wordmark-sub">Duels de culture générale</Text>
                            </View>
                        </View>
                        <Text className="session-title">Bon retour</Text>
                        <Text className="session-subtitle">
                            Connecte-toi pour retrouver ta progression et tes duels.
                        </Text>
                    </View>

                    <View className="session-card">
                        <View className="session-form">
                            <View className="session-field">
                                <Text className="session-label">Adresse e-mail</Text>
                                <TextInput
                                    className={clsx("session-input", emailError && "session-input-error")}
                                    value={email}
                                    onChangeText={(value) => {
                                        setEmail(value);
                                        if (emailError) setEmailError(null);
                                    }}
                                    placeholder="vous@exemple.com"
                                    placeholderTextColor={plateauColors.ink + "80"}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="username"
                                    keyboardType="email-address"
                                    textContentType="username"
                                    editable={!isSubmitting}
                                />
                                {emailError && <Text className="session-error">{emailError}</Text>}
                            </View>

                            <View className="session-field">
                                <Text className="session-label">Mot de passe</Text>
                                <TextInput
                                    className={clsx("session-input", passwordError && "session-input-error")}
                                    value={password}
                                    onChangeText={(value) => {
                                        setPassword(value);
                                        if (passwordError) setPasswordError(null);
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor={plateauColors.ink + "80"}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="current-password"
                                    textContentType="password"
                                    editable={!isSubmitting}
                                />
                                {passwordError && <Text className="session-error">{passwordError}</Text>}
                            </View>

                            {formError && <Text className="session-error">{formError}</Text>}

                            <HardShadowCard borderRadius={16} offsetY={4} className={clsx("solo-cta-button", isSubmitting && "opacity-50")}>
                                <Pressable onPress={handleSignIn} disabled={isSubmitting} accessibilityRole="button">
                                    <Text className="solo-cta-text">{isSubmitting ? "Connexion…" : "Se connecter"}</Text>
                                </Pressable>
                            </HardShadowCard>
                        </View>
                    </View>

                    <View className="session-divider-row">
                        <View className="session-divider-line" />
                        <Text className="session-divider-text">ou</Text>
                        <View className="session-divider-line" />
                    </View>

                    <View className="gap-3">
                        <Pressable
                            className={clsx("session-secondary-button", oauthStrategy !== null && "opacity-50")}
                            onPress={() => handleOAuth("oauth_apple")}
                            disabled={oauthStrategy !== null}
                        >
                            <Text className="session-secondary-text">
                                {oauthStrategy === "oauth_apple" ? "Connexion…" : "Continuer avec Apple"}
                            </Text>
                        </Pressable>
                        <Pressable
                            className={clsx("session-secondary-button", oauthStrategy !== null && "opacity-50")}
                            onPress={() => handleOAuth("oauth_google")}
                            disabled={oauthStrategy !== null}
                        >
                            <Text className="session-secondary-text">
                                {oauthStrategy === "oauth_google" ? "Connexion…" : "Continuer avec Google"}
                            </Text>
                        </Pressable>
                        {oauthError && <Text className="session-error">{oauthError}</Text>}
                    </View>

                    <View className="session-link-row">
                        <Text className="session-link-copy">Pas encore de compte ?</Text>
                        <Link href="/(auth)/sign-up" replace>
                            <Text className="session-link">Créer un compte</Text>
                        </Link>
                    </View>

                    <Pressable
                        className="mt-3 items-center"
                        onPress={async () => {
                            await markOnboardingSeen();
                            router.replace("/(tabs)/joute");
                        }}
                    >
                        <Text className="session-link">Continuer sans compte</Text>
                    </Pressable>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
