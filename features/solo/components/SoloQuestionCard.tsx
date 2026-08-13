import {Pressable, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import * as Haptics from "expo-haptics";
import Animated, {Easing, FadeInDown, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {Question} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import {CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS, QUESTION_ALERT_THRESHOLD_MS, QUESTION_DURATION_MS} from "@/features/joute/constants";
import HardShadowCard from "@/features/joute/components/HardShadowCard";
import {playSound} from "@/lib/sounds";

export interface SoloQuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    isLastQuestion: boolean;
    onClose: () => void;
    onAnswer: (selectedIndex: number | null, elapsedMs: number) => void;
    onContinue: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

const SoloQuestionCard = ({
    question,
    questionNumber,
    totalQuestions,
    isLastQuestion,
    onClose,
    onAnswer,
    onContinue,
}: SoloQuestionCardProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    const startedAtRef = useRef(Date.now());
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const urgentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const progress = useSharedValue(1);
    const reducedMotion = useReducedMotion();

    const handleAnswer = (index: number | null) => {
        setIsRevealed((already) => {
            if (already) return already;

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
            if (index !== null) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            playSound(index !== null && index === question.correctIndex ? "correct" : "incorrect");

            setSelectedIndex(index);
            const elapsedMs = Math.min(QUESTION_DURATION_MS, Date.now() - startedAtRef.current);
            onAnswer(index, elapsedMs);

            return true;
        });
    };

    useEffect(() => {
        setSelectedIndex(null);
        setIsRevealed(false);
        setIsUrgent(false);
        startedAtRef.current = Date.now();

        progress.value = 1;
        progress.value = withTiming(0, {
            duration: reducedMotion ? 0 : QUESTION_DURATION_MS,
            easing: Easing.linear,
        });

        timeoutRef.current = setTimeout(() => handleAnswer(null), QUESTION_DURATION_MS);
        urgentTimeoutRef.current = setTimeout(() => setIsUrgent(true), QUESTION_DURATION_MS - QUESTION_ALERT_THRESHOLD_MS);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.id]);

    const animatedFillStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    return (
        <View className="flex-1">
            <View className="solo-question-header">
                <Pressable className="solo-question-close-button" onPress={onClose} accessibilityRole="button" accessibilityLabel="Quitter la partie">
                    <Text className="solo-question-close-icon">✕</Text>
                </Pressable>
                <View className="items-center">
                    <Text className="solo-question-title">Partie solo</Text>
                    <Text className="solo-question-subtitle">
                        Question {questionNumber} sur {totalQuestions}
                    </Text>
                </View>
                <View className="size-9" />
            </View>

            <View className="solo-timer-track" accessibilityElementsHidden importantForAccessibility="no">
                <Animated.View
                    className="solo-timer-fill"
                    style={[{backgroundColor: isUrgent ? plateauColors.pink : plateauColors.orange}, animatedFillStyle]}
                />
            </View>

            <View className="solo-question-category-pill" style={{backgroundColor: CATEGORY_COLORS[question.category]}}>
                <Text>{CATEGORY_ICONS[question.category]}</Text>
                <Text className="solo-question-category-text">{CATEGORY_LABELS[question.category]}</Text>
            </View>

            <Text className="solo-question-statement">{question.statement}</Text>

            <View className="solo-choices">
                {question.choices.map((choice, index) => {
                    const isCorrectChoice = index === question.correctIndex;
                    const isSelected = index === selectedIndex;
                    const showAsCorrect = isRevealed && isCorrectChoice;
                    const showAsIncorrect = isRevealed && isSelected && !isCorrectChoice;

                    return (
                        <View
                            key={choice}
                            className={clsx("solo-choice", showAsCorrect && "solo-choice-correct", showAsIncorrect && "solo-choice-incorrect")}
                        >
                            <View
                                className={clsx(
                                    "solo-choice-badge",
                                    showAsCorrect && "solo-choice-badge-correct",
                                    showAsIncorrect && "solo-choice-badge-incorrect",
                                )}
                            >
                                <Text
                                    className={clsx(
                                        "solo-choice-badge-text",
                                        showAsCorrect && "solo-choice-badge-text-correct",
                                        showAsIncorrect && "solo-choice-badge-text-incorrect",
                                    )}
                                >
                                    {showAsCorrect ? "✓" : showAsIncorrect ? "✕" : LETTERS[index]}
                                </Text>
                            </View>
                            <Pressable
                                className="flex-1"
                                onPress={() => handleAnswer(index)}
                                disabled={isRevealed}
                                accessibilityRole="button"
                                accessibilityLabel={`Proposition ${LETTERS[index]} : ${choice}`}
                                accessibilityState={{selected: isSelected, disabled: isRevealed}}
                            >
                                <Text className={clsx("solo-choice-text", (showAsCorrect || showAsIncorrect) && "solo-choice-text-revealed")}>
                                    {choice}
                                </Text>
                            </Pressable>
                        </View>
                    );
                })}
            </View>

            {isRevealed && (
                <Animated.View entering={FadeInDown.duration(280)}>
                    <View className="solo-explanation-card">
                        <Text className="solo-explanation-label">Le saviez-vous</Text>
                        <Text className="solo-explanation-text">{question.explanation}</Text>
                    </View>

                    <View className="solo-footer">
                        <HardShadowCard borderRadius={20} offsetY={5} className="solo-cta-button">
                            <Pressable onPress={onContinue} accessibilityRole="button">
                                <Text className="solo-cta-text">{isLastQuestion ? "Voir les résultats" : "Question suivante"}</Text>
                            </Pressable>
                        </HardShadowCard>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

export default SoloQuestionCard;
