import {Pressable, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import * as Haptics from "expo-haptics";
import Animated, {Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {Question} from "@/game/types";
import {colors} from "@/constants/theme";
import {QUESTION_ALERT_THRESHOLD_MS, QUESTION_DURATION_MS, QUESTION_TRANSITION_MS} from "../constants";

export interface QuestionStepProps {
    question: Question;
    questionNumber: number;
    roundNumber: number;
    onAnswer: (selectedIndex: number | null, elapsedMs: number) => void;
}

const QuestionStep = ({question, questionNumber, roundNumber, onAnswer}: QuestionStepProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    const startedAtRef = useRef(Date.now());
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const urgentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const progress = useSharedValue(1);
    const reducedMotion = useReducedMotion();

    const handleAnswer = (index: number | null) => {
        setIsAnswered((already) => {
            if (already) return already;

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
            if (index !== null) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            setSelectedIndex(index);
            const elapsedMs = Math.min(QUESTION_DURATION_MS, Date.now() - startedAtRef.current);
            setTimeout(() => onAnswer(index, elapsedMs), QUESTION_TRANSITION_MS);

            return true;
        });
    };

    useEffect(() => {
        setSelectedIndex(null);
        setIsAnswered(false);
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
        <View className="gap-5">
            <Text className="joute-step-title">
                Manche {roundNumber} sur 8 · Question {questionNumber} / 3
            </Text>

            <View className="joute-progress-track" accessibilityElementsHidden importantForAccessibility="no">
                <Animated.View
                    style={[
                        {height: "100%", borderRadius: 999, backgroundColor: isUrgent ? colors.destructive : colors.accent},
                        animatedFillStyle,
                    ]}
                />
            </View>

            <Text className="joute-question-statement">{question.statement}</Text>

            <View className="gap-3">
                {question.choices.map((choice, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                        <Pressable
                            key={choice}
                            className={clsx("joute-choice", isSelected && "joute-choice-selected")}
                            onPress={() => handleAnswer(index)}
                            disabled={isAnswered}
                            accessibilityRole="button"
                            accessibilityLabel={`Proposition ${index + 1} : ${choice}`}
                            accessibilityState={{selected: isSelected, disabled: isAnswered}}
                        >
                            <Text className={clsx("joute-choice-text", isSelected && "joute-choice-text-selected")}>
                                {choice}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

export default QuestionStep;
