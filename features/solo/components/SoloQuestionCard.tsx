import {Image, Pressable, Text, View} from "react-native";
import PressableScale from "@/components/PressableScale";
import PrimaryButton from "@/components/PrimaryButton";
import React, {useEffect, useRef, useState} from "react";
import Animated, {Easing, FadeInDown, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {Question} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import {QUESTION_ALERT_THRESHOLD_MS, QUESTION_DURATION_MS} from "@/features/joute/constants";
import {resolveChoiceStyle} from "@/game/choiceStyle";
import {playSound} from "@/lib/sounds";
import {impactLight} from "@/lib/haptics";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import InkPattern from "@/components/InkPattern";
import TimerRing from "@/components/TimerRing";

export interface SoloQuestionCardProps {
    question: Question;
    questionNumber: number;
    totalQuestions: number;
    score: number;
    isLastQuestion: boolean;
    onClose: () => void;
    onAnswer: (selectedIndex: number | null, elapsedMs: number) => void;
    onContinue: () => void;
}

const LETTERS = ["A", "B", "C", "D"];
const QUESTION_DURATION_S = Math.ceil(QUESTION_DURATION_MS / 1000);

const SoloQuestionCard = ({
    question,
    questionNumber,
    totalQuestions,
    score,
    isLastQuestion,
    onClose,
    onAnswer,
    onContinue,
}: SoloQuestionCardProps) => {
    const {avatarUrl} = useCurrentPlayer();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isRevealed, setIsRevealed] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(QUESTION_DURATION_S);

    const startedAtRef = useRef(Date.now());
    const hasAnsweredRef = useRef(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const urgentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const progress = useSharedValue(1);
    const reducedMotion = useReducedMotion();

    const handleAnswer = (index: number | null) => {
        if (hasAnsweredRef.current) return;
        hasAnsweredRef.current = true;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
        if (tickRef.current) clearInterval(tickRef.current);
        if (index !== null) impactLight();
        playSound(index !== null && index === question.correctIndex ? "correct" : "incorrect");

        setSelectedIndex(index);
        setIsRevealed(true);
        const elapsedMs = Math.min(QUESTION_DURATION_MS, Date.now() - startedAtRef.current);
        onAnswer(index, elapsedMs);
    };

    useEffect(() => {
        setSelectedIndex(null);
        setIsRevealed(false);
        setIsUrgent(false);
        setSecondsLeft(QUESTION_DURATION_S);
        hasAnsweredRef.current = false;
        startedAtRef.current = Date.now();

        progress.value = 1;
        progress.value = withTiming(0, {
            duration: reducedMotion ? 0 : QUESTION_DURATION_MS,
            easing: Easing.linear,
        });

        timeoutRef.current = setTimeout(() => handleAnswer(null), QUESTION_DURATION_MS);
        urgentTimeoutRef.current = setTimeout(() => setIsUrgent(true), QUESTION_DURATION_MS - QUESTION_ALERT_THRESHOLD_MS);
        tickRef.current = setInterval(() => {
            setSecondsLeft((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
            if (tickRef.current) clearInterval(tickRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question.id]);

    return (
        <View className="relative flex-1 overflow-hidden">
            <InkPattern />

            <View className="solo-question-header">
                <Pressable className="solo-question-close-button" onPress={onClose} accessibilityRole="button" accessibilityLabel="Quitter la partie">
                    <Text className="solo-question-close-icon">✕</Text>
                </Pressable>
                <View className="items-center">
                    <Text className="solo-question-title">Solo</Text>
                    <Text className="solo-question-subtitle">
                        Question {questionNumber} sur {totalQuestions}
                    </Text>
                </View>
                <View className="size-9" />
            </View>

            <View className="solo-question-score-row">
                <View className="solo-question-score-side">
                    {avatarUrl ? (
                        <Image source={{uri: avatarUrl}} className="solo-question-avatar" />
                    ) : (
                        <View className="solo-question-avatar" style={{backgroundColor: plateauColors.iris}} />
                    )}
                    <Text className="solo-question-score-value">{score}</Text>
                </View>

                <TimerRing
                    size={78}
                    progress={progress}
                    trackColor="rgba(246,240,230,0.14)"
                    activeColor={isUrgent ? plateauColors.rose : plateauColors.teal}
                >
                    <View className="solo-question-timer-face">
                        <Text className="solo-question-timer-value" style={{color: isUrgent ? plateauColors.rose : plateauColors.paper}}>
                            {String(secondsLeft).padStart(2, "0")}
                        </Text>
                        <Text className="solo-question-timer-label">SEC</Text>
                    </View>
                </TimerRing>

                <View className="size-10" />
            </View>

            <View className="solo-question-statement">
                <Text className="text-eyebrow text-plateau-teal">Question</Text>
                <Text className="text-question text-plateau-paper">{question.statement}</Text>
            </View>

            <View className="solo-choices">
                {question.choices.map((choice, index) => {
                    const style = resolveChoiceStyle(index, isRevealed, selectedIndex, question.correctIndex);
                    return (
                        <PressableScale
                            key={choice}
                            activeScale={0.98}
                            className="solo-choice"
                            style={{backgroundColor: style.backgroundColor, borderColor: style.borderColor}}
                            onPress={() => handleAnswer(index)}
                            disabled={isRevealed}
                            accessibilityRole="button"
                            accessibilityLabel={`Proposition ${LETTERS[index]} : ${choice}`}
                            accessibilityState={{selected: selectedIndex === index, disabled: isRevealed}}
                        >
                            <View className="solo-choice-badge" style={{backgroundColor: style.badgeBackgroundColor}}>
                                <Text className="solo-choice-badge-text" style={{color: style.badgeTextColor}}>
                                    {LETTERS[index]}
                                </Text>
                            </View>
                            <Text className="solo-choice-text" style={{color: style.textColor}}>
                                {choice}
                            </Text>
                        </PressableScale>
                    );
                })}
            </View>

            {isRevealed && (
                <Animated.View entering={FadeInDown.duration(280)} className="relative">
                    <View className="solo-explanation-card">
                        <Text className="solo-explanation-label">Le saviez-vous</Text>
                        <Text className="solo-explanation-text">{question.explanation}</Text>
                    </View>

                    <View className="solo-footer">
                        <PrimaryButton title={isLastQuestion ? "Voir les résultats" : "Question suivante"} onPress={onContinue} />
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

export default SoloQuestionCard;
