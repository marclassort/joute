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
import { Link } from "expo-router";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import { useAuth, useSignIn } from "@clerk/expo";
import { colors } from "@/constants/theme";
import { isValidEmail } from "@/lib/utils";

const SafeAreaView = styled(RNSafeAreaView);

const SignIn = () => {
    const { isLoaded } = useAuth();
    const { signIn } = useSignIn();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLoaded) {
        return (
            <SafeAreaView className="auth-safe-area items-center justify-center">
                <ActivityIndicator size="large" color={colors.accent} />
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

    return (
        <SafeAreaView className="auth-safe-area">
            <KeyboardAvoidingView
                className="auth-screen"
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    className="auth-scroll"
                    contentContainerClassName="auth-content"
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="auth-brand-block">
                        <View className="auth-logo-wrap">
                            <View className="auth-logo-mark">
                                <Text className="auth-logo-mark-text">J</Text>
                            </View>
                            <View>
                                <Text className="auth-wordmark">Joute</Text>
                                <Text className="auth-wordmark-sub">Vos abonnements</Text>
                            </View>
                        </View>
                        <Text className="auth-title">Bon retour</Text>
                        <Text className="auth-subtitle">
                            Connectez-vous pour retrouver votre solde et vos abonnements.
                        </Text>
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            <View className="auth-field">
                                <Text className="auth-label">Adresse e-mail</Text>
                                <TextInput
                                    className={clsx("auth-input", emailError && "auth-input-error")}
                                    value={email}
                                    onChangeText={(value) => {
                                        setEmail(value);
                                        if (emailError) setEmailError(null);
                                    }}
                                    placeholder="vous@exemple.com"
                                    placeholderTextColor={colors.mutedForeground}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    autoComplete="username"
                                    keyboardType="email-address"
                                    textContentType="username"
                                    editable={!isSubmitting}
                                />
                                {emailError && <Text className="auth-error">{emailError}</Text>}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Mot de passe</Text>
                                <TextInput
                                    className={clsx("auth-input", passwordError && "auth-input-error")}
                                    value={password}
                                    onChangeText={(value) => {
                                        setPassword(value);
                                        if (passwordError) setPasswordError(null);
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.mutedForeground}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="current-password"
                                    textContentType="password"
                                    editable={!isSubmitting}
                                />
                                {passwordError && <Text className="auth-error">{passwordError}</Text>}
                            </View>

                            {formError && <Text className="auth-error">{formError}</Text>}

                            <Pressable
                                className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                                onPress={handleSignIn}
                                disabled={isSubmitting}
                            >
                                <Text className="auth-button-text">
                                    {isSubmitting ? "Connexion…" : "Se connecter"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="auth-link-row">
                        <Text className="auth-link-copy">Pas encore de compte ?</Text>
                        <Link href="/(auth)/sign-up" replace>
                            <Text className="auth-link">Créer un compte</Text>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
