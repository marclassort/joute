import {Image, Pressable, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import * as Haptics from "expo-haptics";
import Animated, {Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {Player, Question} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import {QUESTION_ALERT_THRESHOLD_MS, QUESTION_DURATION_MS, QUESTION_TRANSITION_MS} from "../constants";
import {playSound} from "@/lib/sounds";

export interface QuestionStepProps {
    question: Question;
    questionNumber: number;
    roundNumber: number;
    me: Player;
    opponent: Player;
    myScore: number;
    opponentScore: number;
    onClose: () => void;
    onAnswer: (selectedIndex: number | null, elapsedMs: number) => void;
}

const LETTERS = ["A", "B", "C", "D"];

const QuestionStep = ({question, questionNumber, roundNumber, me, opponent, myScore, opponentScore, onClose, onAnswer}: QuestionStepProps) => {
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
            playSound(index !== null && index === question.correctIndex ? "correct" : "incorrect");

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
        <View className="gap-0">
            <View className="duel-header">
                <Pressable className="duel-close-button" onPress={onClose} accessibilityRole="button" accessibilityLabel="Quitter la partie">
                    <Text className="duel-close-icon">✕</Text>
                </Pressable>
                <View className="items-center">
                    <Text className="duel-header-title">
                        Manche {roundNumber} · {opponent.displayName}
                    </Text>
                    <Text className="duel-header-subtitle">Question {questionNumber} / 3</Text>
                </View>
                <View className="size-9" />
            </View>

            <View className="duel-score-row">
                <View className="duel-score-side">
                    {me.avatarUrl ? (
                        <Image source={{uri: me.avatarUrl}} className="duel-avatar" />
                    ) : (
                        <View className="duel-avatar" style={{backgroundColor: plateauColors.violet}} />
                    )}
                    <View>
                        <Text className="duel-player-name">Toi</Text>
                        <Text className="duel-player-score" style={{color: plateauColors.lime}}>
                            {myScore}
                        </Text>
                    </View>
                </View>
                <View className="duel-score-side duel-score-side-right">
                    {opponent.avatarUrl ? (
                        <Image source={{uri: opponent.avatarUrl}} className="duel-avatar" />
                    ) : (
                        <View className="duel-avatar" style={{backgroundColor: plateauColors.pink}} />
                    )}
                    <View className="items-end">
                        <Text className="duel-player-name" numberOfLines={1}>
                            {opponent.displayName}
                        </Text>
                        <Text className="duel-player-score text-plateau-cream">{opponentScore}</Text>
                    </View>
                </View>
            </View>

            <View className="duel-timer-track" accessibilityElementsHidden importantForAccessibility="no">
                <Animated.View
                    className="duel-timer-fill"
                    style={[{backgroundColor: isUrgent ? plateauColors.pink : plateauColors.orange}, animatedFillStyle]}
                />
            </View>

            <View className="duel-question-card">
                <Text className="duel-question-label">
                    {question.category} · difficulté {question.difficulty}
                </Text>
                <Text className="duel-question-statement">{question.statement}</Text>
            </View>

            <View className="duel-choices">
                {question.choices.map((choice, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                        <Pressable
                            key={choice}
                            className={clsx("duel-choice", isSelected && "duel-choice-selected")}
                            onPress={() => handleAnswer(index)}
                            disabled={isAnswered}
                            accessibilityRole="button"
                            accessibilityLabel={`Proposition ${LETTERS[index]} : ${choice}`}
                            accessibilityState={{selected: isSelected, disabled: isAnswered}}
                        >
                            <View className={clsx("duel-choice-badge", isSelected && "duel-choice-badge-selected")}>
                                <Text className={clsx("duel-choice-badge-text", isSelected && "duel-choice-badge-text-selected")}>
                                    {LETTERS[index]}
                                </Text>
                            </View>
                            <Text className={clsx("duel-choice-text", isSelected && "duel-choice-text-selected")}>{choice}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

export default QuestionStep;
