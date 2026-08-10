import { useEffect, useState } from "react";
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

const SafeAreaView = styled(RNSafeAreaView);

const CODE_LENGTH = 6;

const VerifyEmail = () => {
    const router = useRouter();
    const { isLoaded } = useAuth();
    const { signUp } = useSignUp();

    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resent, setResent] = useState(false);

    const email = signUp?.emailAddress ?? null;

    useEffect(() => {
        if (isLoaded && !email) {
            router.replace("/(auth)/sign-up");
        }
    }, [isLoaded, email, router]);

    if (!isLoaded || !signUp || !email) {
        return (
            <SafeAreaView className="auth-safe-area items-center justify-center">
                <ActivityIndicator size="large" color={colors.accent} />
            </SafeAreaView>
        );
    }

    const handleVerify = async () => {
        if (code.trim().length < CODE_LENGTH) {
            setError("Entrez le code à 6 chiffres reçu par e-mail.");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            const { error: verifyError } = await signUp.verifications.verifyEmailCode({
                code: code.trim(),
            });
            if (verifyError) {
                console.error("verifyEmailCode error", verifyError);
                setError(verifyError.longMessage ?? "Ce code est incorrect ou a expiré.");
                return;
            }

            if (signUp.status !== "complete") {
                console.error("sign-up not complete after verification", {
                    status: signUp.status,
                    missingFields: signUp.missingFields,
                    unverifiedFields: signUp.unverifiedFields,
                });
                setError(
                    signUp.missingFields?.length
                        ? `Informations manquantes : ${signUp.missingFields.join(", ")}.`
                        : "Impossible de finaliser l'inscription pour le moment.",
                );
                return;
            }

            const { error: finalizeError } = await signUp.finalize();
            if (finalizeError) {
                console.error("finalize error", finalizeError);
                setError(finalizeError.longMessage ?? "Une erreur est survenue. Réessayez.");
            }
        } catch (caughtError) {
            console.error("verify-email unexpected error", caughtError);
            setError("Impossible de vérifier ce code pour le moment. Réessayez.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (isResending) return;

        setError(null);
        setResent(false);
        setIsResending(true);
        try {
            const { error: resendError } = await signUp.verifications.sendEmailCode();
            if (resendError) {
                console.error("sendEmailCode (resend) error", resendError, {
                    status: signUp.status,
                    emailVerificationStatus: signUp.verifications.emailAddress?.status,
                });
                setError(resendError.longMessage ?? "Impossible de renvoyer le code.");
                return;
            }
            setResent(true);
        } catch (caughtError) {
            console.error("resend unexpected error", caughtError);
            setError("Impossible de renvoyer le code pour le moment.");
        } finally {
            setIsResending(false);
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
                        <Text className="auth-title">Vérifiez votre e-mail</Text>
                        <Text className="auth-subtitle">
                            Entrez le code à 6 chiffres envoyé à {email}.
                        </Text>
                    </View>

                    <View className="auth-card">
                        <View className="auth-form">
                            <View className="auth-field">
                                <Text className="auth-label">Code de vérification</Text>
                                <TextInput
                                    className={clsx("auth-input", error && "auth-input-error")}
                                    style={{ textAlign: "center", letterSpacing: 8 }}
                                    value={code}
                                    onChangeText={(value) => {
                                        setCode(value.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH));
                                        if (error) setError(null);
                                    }}
                                    placeholder="000000"
                                    placeholderTextColor={colors.mutedForeground}
                                    keyboardType="number-pad"
                                    textContentType="oneTimeCode"
                                    maxLength={CODE_LENGTH}
                                    editable={!isSubmitting}
                                />
                                {error && <Text className="auth-error">{error}</Text>}
                            </View>

                            <Pressable
                                className={clsx("auth-button", isSubmitting && "auth-button-disabled")}
                                onPress={handleVerify}
                                disabled={isSubmitting}
                            >
                                <Text className="auth-button-text">
                                    {isSubmitting ? "Vérification…" : "Confirmer"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="auth-divider-row">
                        <View className="auth-divider-line" />
                        <Text className="auth-divider-text">
                            {resent ? "Code renvoyé" : "Rien reçu ?"}
                        </Text>
                        <View className="auth-divider-line" />
                    </View>

                    <Pressable
                        className="auth-secondary-button"
                        onPress={handleResend}
                        disabled={isResending}
                    >
                        <Text className="auth-secondary-button-text">
                            {isResending ? "Envoi…" : "Renvoyer le code"}
                        </Text>
                    </Pressable>

                    <View className="auth-link-row">
                        <Text className="auth-link-copy">Mauvaise adresse ?</Text>
                        <Link href="/(auth)/sign-up" replace>
                            <Text className="auth-link">Modifier</Text>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default VerifyEmail;
