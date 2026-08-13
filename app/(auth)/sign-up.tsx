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
import { useAuth, useSignUp } from "@clerk/expo";
import { plateauColors } from "@/constants/theme";
import { isValidEmail } from "@/lib/utils";
import HardShadowCard from "@/features/joute/components/HardShadowCard";

const SafeAreaView = styled(RNSafeAreaView);

const MIN_PASSWORD_LENGTH = 8;

const SignUp = () => {
    const router = useRouter();
    const { isLoaded } = useAuth();
    const { signUp } = useSignUp();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isLoaded) {
        return (
            <SafeAreaView className="session-safe-area items-center justify-center">
                <ActivityIndicator size="large" color={plateauColors.orange} />
            </SafeAreaView>
        );
    }

    const handleSignUp = async () => {
        if (!signUp) return;

        const trimmedEmail = email.trim();
        const nextEmailError = !trimmedEmail
            ? "Entrez votre adresse e-mail."
            : !isValidEmail(trimmedEmail)
                ? "Cette adresse e-mail n'est pas valide."
                : null;
        const nextPasswordError = !password
            ? "Choisissez un mot de passe."
            : password.length < MIN_PASSWORD_LENGTH
                ? `Au moins ${MIN_PASSWORD_LENGTH} caractères.`
                : null;
        const nextConfirmPasswordError =
            !nextPasswordError && confirmPassword !== password
                ? "Les mots de passe ne correspondent pas."
                : null;

        setEmailError(nextEmailError);
        setPasswordError(nextPasswordError);
        setConfirmPasswordError(nextConfirmPasswordError);
        setFormError(null);

        if (nextEmailError || nextPasswordError || nextConfirmPasswordError) return;

        setIsSubmitting(true);
        try {
            const { error } = await signUp.password({ emailAddress: trimmedEmail, password });
            if (error) {
                setFormError(error.longMessage ?? "Impossible de créer ce compte. Réessayez.");
                return;
            }

            const { error: sendError } = await signUp.verifications.sendEmailCode();
            if (sendError) {
                setFormError(sendError.longMessage ?? "Impossible d'envoyer le code de vérification.");
                return;
            }

            router.push("/(auth)/verify-email");
        } catch {
            setFormError("Impossible de créer votre compte pour le moment. Réessayez.");
        } finally {
            setIsSubmitting(false);
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
                        <Text className="session-title">Créez votre compte</Text>
                        <Text className="session-subtitle">
                            Débloque les duels, le classement et le suivi de ta progression.
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
                                    autoComplete="email"
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
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
                                    autoComplete="new-password"
                                    textContentType="newPassword"
                                    passwordRules={`minlength: ${MIN_PASSWORD_LENGTH};`}
                                    editable={!isSubmitting}
                                />
                                {passwordError ? (
                                    <Text className="session-error">{passwordError}</Text>
                                ) : (
                                    <Text className="session-helper">
                                        {MIN_PASSWORD_LENGTH} caractères minimum.
                                    </Text>
                                )}
                            </View>

                            <View className="session-field">
                                <Text className="session-label">Confirmer le mot de passe</Text>
                                <TextInput
                                    className={clsx("session-input", confirmPasswordError && "session-input-error")}
                                    value={confirmPassword}
                                    onChangeText={(value) => {
                                        setConfirmPassword(value);
                                        if (confirmPasswordError) setConfirmPasswordError(null);
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor={plateauColors.ink + "80"}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    textContentType="newPassword"
                                    passwordRules={`minlength: ${MIN_PASSWORD_LENGTH};`}
                                    editable={!isSubmitting}
                                />
                                {confirmPasswordError && (
                                    <Text className="session-error">{confirmPasswordError}</Text>
                                )}
                            </View>

                            {formError && <Text className="session-error">{formError}</Text>}

                            <HardShadowCard borderRadius={16} offsetY={4} className={clsx("solo-cta-button", isSubmitting && "opacity-50")}>
                                <Pressable onPress={handleSignUp} disabled={isSubmitting} accessibilityRole="button">
                                    <Text className="solo-cta-text">{isSubmitting ? "Création…" : "Créer mon compte"}</Text>
                                </Pressable>
                            </HardShadowCard>
                        </View>
                    </View>

                    <View className="session-link-row">
                        <Text className="session-link-copy">Vous avez déjà un compte ?</Text>
                        <Link href="/(auth)/sign-in" replace>
                            <Text className="session-link">Se connecter</Text>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;
