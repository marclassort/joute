import {Pressable, Text, TextInput, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import Animated, {Easing, FadeInDown, ZoomIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {Question} from "@/game/types";
import {isAnswerCorrect} from "@/game/textMatch";
import {computeHint} from "@/game/streakEngine";
import {CATEGORY_LABELS, QUESTION_ALERT_THRESHOLD_MS, QUESTION_DURATION_MS} from "@/features/joute/constants";
import {playSound} from "@/lib/sounds";
import {notifyError, notifySuccess} from "@/lib/haptics";

export interface StreakQuestionCardProps {
    question: Question;
    streakCount: number;
    onAnswer: (submittedText: string, usedHint: boolean, elapsedMs: number, isCorrect: boolean) => void;
    onContinue: () => void;
}

const StreakQuestionCard = ({question, streakCount, onAnswer, onContinue}: StreakQuestionCardProps) => {
    const [text, setText] = useState("");
    const [isRevealed, setIsRevealed] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(Math.ceil(QUESTION_DURATION_MS / 1000));

    const hintUsedRef = useRef(false);
    const startedAtRef = useRef(Date.now());
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const urgentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const progress = useSharedValue(1);
    const reducedMotion = useReducedMotion();

    const submit = (submittedText: string) => {
        setIsRevealed((already) => {
            if (already) return already;

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);

            const correct = isAnswerCorrect(submittedText, question.choices[question.correctIndex]);
            setIsCorrect(correct);
            if (correct) notifySuccess();
            else notifyError();
            playSound(correct ? "correct" : "incorrect");

            const elapsedMs = Math.min(QUESTION_DURATION_MS, Date.now() - startedAtRef.current);
            onAnswer(submittedText, hintUsedRef.current, elapsedMs, correct);

            return true;
        });
    };

    const handleHint = () => {
        hintUsedRef.current = true;
        setHint(computeHint(question));
    };

    useEffect(() => {
        setText("");
        setIsRevealed(false);
        setIsCorrect(false);
        setIsUrgent(false);
        setHint(null);
        setSecondsLeft(Math.ceil(QUESTION_DURATION_MS / 1000));
        hintUsedRef.current = false;
        startedAtRef.current = Date.now();

        progress.value = 1;
        progress.value = withTiming(0, {duration: reducedMotion ? 0 : QUESTION_DURATION_MS, easing: Easing.linear});

        timeoutRef.current = setTimeout(() => submit(""), QUESTION_DURATION_MS);
        urgentTimeoutRef.current = setTimeout(() => setIsUrgent(true), QUESTION_DURATION_MS - QUESTION_ALERT_THRESHOLD_MS);
        intervalRef.current = setInterval(() => {
            const remainingMs = QUESTION_DURATION_MS - (Date.now() - startedAtRef.current);
            setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
        }, 250);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.id]);

    const animatedFillStyle = useAnimatedStyle(() => ({width: `${progress.value * 100}%`}));

    return (
        <View>
            <View className="streak-header">
                <Text className="streak-header-title">Réponse libre · 4 à la suite</Text>
                <View className="streak-badge">
                    <Text className="streak-badge-text">{streakCount} 🔥</Text>
                </View>
            </View>

            <View className="streak-progress-track" accessibilityElementsHidden importantForAccessibility="no">
                <Animated.View className="streak-progress-fill" style={animatedFillStyle} />
            </View>

            <Text className="streak-category-label">{CATEGORY_LABELS[question.category]}</Text>
            <Text className="streak-statement">{question.statement}</Text>

            <View className="streak-answer-card">
                <Text className="streak-answer-label">Ta réponse</Text>
                <TextInput
                    className="streak-answer-input"
                    value={text}
                    onChangeText={setText}
                    editable={!isRevealed}
                    autoFocus
                    autoCorrect={false}
                    autoCapitalize="none"
                    placeholder="…"
                    onSubmitEditing={() => submit(text)}
                    returnKeyType="done"
                />
                <View className="streak-tolerance-row">
                    <View className="streak-tolerance-check">
                        <Text className="streak-tolerance-check-text">✓</Text>
                    </View>
                    <Text className="streak-tolerance-text">Accents et fautes légères acceptés</Text>
                </View>
            </View>

            {!isRevealed && (
                <View className="streak-actions-row">
                    <Pressable className="streak-action-pill" onPress={handleHint} disabled={!!hint} accessibilityRole="button">
                        <Text className="streak-action-pill-text">💡 Indice</Text>
                    </Pressable>
                    <Pressable className="streak-action-pill" onPress={() => submit("")} accessibilityRole="button">
                        <Text className="streak-action-pill-text">Passer</Text>
                    </Pressable>
                </View>
            )}

            {hint && !isRevealed && (
                <View className="streak-hint-banner">
                    <Text className="streak-hint-text">Ça commence par « {hint} »</Text>
                </View>
            )}

            {isRevealed && (
                <Animated.View
                    entering={ZoomIn.duration(260)}
                    className={clsx("streak-reveal-card", isCorrect ? "streak-reveal-correct" : "streak-reveal-incorrect")}
                >
                    <Text className="streak-reveal-title">
                        {isCorrect ? "✓ Bonne réponse !" : `✕ La bonne réponse était : ${question.choices[question.correctIndex]}`}
                    </Text>
                    <Text className="streak-reveal-explanation">{question.explanation}</Text>
                </Animated.View>
            )}

            {!isRevealed ? (
                <View className="streak-footer">
                    <View className="streak-footer-row">
                        <Text className="streak-footer-label">Il te reste</Text>
                        <Text className={clsx("streak-footer-timer", isUrgent && "text-plateau-rose")}>
                            {String(secondsLeft).padStart(2, "0")} s
                        </Text>
                    </View>
                    <Pressable className="streak-submit-button" onPress={() => submit(text)} accessibilityRole="button">
                        <Text className="streak-submit-text">Valider</Text>
                    </Pressable>
                </View>
            ) : (
                <Animated.View entering={FadeInDown.duration(280).delay(80)} className="streak-footer">
                    <Pressable className="streak-submit-button" onPress={onContinue} accessibilityRole="button">
                        <Text className="streak-submit-text">{isCorrect ? "Question suivante" : "Voir mon score"}</Text>
                    </Pressable>
                </Animated.View>
            )}
        </View>
    );
};

export default StreakQuestionCard;
