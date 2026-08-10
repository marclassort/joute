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
import { colors } from "@/constants/theme";
import { isValidEmail } from "@/lib/utils";

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
            <SafeAreaView className="auth-safe-area items-center justify-center">
                <ActivityIndicator size="large" color={colors.accent} />
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
                        <Text className="auth-title">Créez votre compte</Text>
                        <Text className="auth-subtitle">
                            Centralisez vos abonnements et ne manquez plus jamais un renouvellement.
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
                                    autoComplete="email"
                                    keyboardType="email-address"
                                    textContentType="emailAddress"
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
                                    autoComplete="new-password"
                                    textContentType="newPassword"
                                    editable={!isSubmitting}
                                />
                                {passwordError ? (
                                    <Text className="auth-error">{passwordError}</Text>
                                ) : (
                                    <Text className="auth-helper">
                                        {MIN_PASSWORD_LENGTH} caractères minimum.
                                    </Text>
                                )}
                            </View>

                            <View className="auth-field">
                                <Text className="auth-label">Confirmer le mot de passe</Text>
                                <TextInput
                                    className={clsx("auth-input", confirmPasswordError && "auth-input-error")}
                                    value={confirmPassword}
                                    onChangeText={(value) => {
                                        setConfirmPassword(value);
                                        if (confirmPasswordError) setConfirmPasswordError(null);
                                    }}
                                    placeholder="••••••••"
                                    placeholderTextColor={colors.mutedForeground}
                                    secureTextEntry
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    textContentType="newPassword"
                                    editable={!isSubmitting}
                                />
                                {confirmPasswordError && (
                                    <Text className="auth-error">{confirmPasswordError}</Text>
                                )}
                            </View>

                            {formError && <Text className="auth-error">{formError}</Text>}

                            <Pressable
                                className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                                onPress={handleSignUp}
                                disabled={isSubmitting}
                            >
                                <Text className="auth-button-text">
                                    {isSubmitting ? "Création…" : "Créer mon compte"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="auth-link-row">
                        <Text className="auth-link-copy">Vous avez déjà un compte ?</Text>
                        <Link href="/(auth)/sign-in" replace>
                            <Text className="auth-link">Se connecter</Text>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;
