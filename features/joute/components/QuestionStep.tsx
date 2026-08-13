import {Image, Pressable, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {Easing, useReducedMotion, useSharedValue, withTiming} from "react-native-reanimated";
import {impactLight} from "@/lib/haptics";
import {Player, Question} from "@/game/types";
import {plateauColors} from "@/constants/theme";
import {QUESTION_ALERT_THRESHOLD_MS, QUESTION_DURATION_MS, QUESTION_TRANSITION_MS} from "../constants";
import {playSound} from "@/lib/sounds";
import InkPattern from "@/components/InkPattern";
import TimerRing from "@/components/TimerRing";
import {resolveChoiceStyle} from "@/game/choiceStyle";

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
const QUESTION_DURATION_S = Math.ceil(QUESTION_DURATION_MS / 1000);

const QuestionStep = ({question, questionNumber, roundNumber, me, opponent, myScore, opponentScore, onClose, onAnswer}: QuestionStepProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [secondsLeft, setSecondsLeft] = useState(QUESTION_DURATION_S);

    const startedAtRef = useRef(Date.now());
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const urgentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const progress = useSharedValue(1);
    const reducedMotion = useReducedMotion();

    const handleAnswer = (index: number | null) => {
        setIsAnswered((already) => {
            if (already) return already;

            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (urgentTimeoutRef.current) clearTimeout(urgentTimeoutRef.current);
            if (tickRef.current) clearInterval(tickRef.current);
            if (index !== null) impactLight();
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
        setSecondsLeft(QUESTION_DURATION_S);
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
        <View className="relative overflow-hidden">
            <InkPattern />

            <View className="duel-play-topbar">
                <Pressable className="duel-play-close" onPress={onClose} accessibilityRole="button" accessibilityLabel="Quitter la partie">
                    <Text className="duel-close-icon">✕</Text>
                </Pressable>
                <View className="duel-play-pill">
                    <Text className="duel-play-pill-text" numberOfLines={1}>
                        {question.category} · Q{questionNumber}/3
                    </Text>
                </View>
                <View className="size-9" />
            </View>

            <View className="duel-play-score-row">
                <View className="duel-play-score-side">
                    {me.avatarUrl ? (
                        <Image source={{uri: me.avatarUrl}} className="duel-play-avatar" />
                    ) : (
                        <View className="duel-play-avatar" style={{backgroundColor: plateauColors.iris}} />
                    )}
                    <Text className="duel-play-score-value">{myScore}</Text>
                </View>

                <TimerRing
                    size={78}
                    progress={progress}
                    trackColor="rgba(246,240,230,0.14)"
                    activeColor={isUrgent ? plateauColors.rose : plateauColors.teal}
                >
                    <View className="duel-play-timer-face">
                        <Text className="duel-play-timer-value" style={{color: isUrgent ? plateauColors.rose : plateauColors.paper}}>
                            {String(secondsLeft).padStart(2, "0")}
                        </Text>
                        <Text className="duel-play-timer-label">SEC</Text>
                    </View>
                </TimerRing>

                <View className="duel-play-score-side duel-play-score-side-right">
                    <Text className="duel-play-score-value">{opponentScore}</Text>
                    {opponent.avatarUrl ? (
                        <Image source={{uri: opponent.avatarUrl}} className="duel-play-avatar" />
                    ) : (
                        <View className="duel-play-avatar" style={{backgroundColor: plateauColors.rose}} />
                    )}
                </View>
            </View>

            <View className="duel-play-question-card">
                <Text className="text-eyebrow text-plateau-teal">
                    Manche {roundNumber} · Question
                </Text>
                <Text className="text-question text-plateau-paper">{question.statement}</Text>
            </View>

            <View className="duel-play-choices">
                {question.choices.map((choice, index) => {
                    const style = resolveChoiceStyle(index, isAnswered, selectedIndex, question.correctIndex);
                    return (
                        <Pressable
                            key={choice}
                            className="duel-play-choice"
                            style={{backgroundColor: style.backgroundColor, borderColor: style.borderColor}}
                            onPress={() => handleAnswer(index)}
                            disabled={isAnswered}
                            accessibilityRole="button"
                            accessibilityLabel={`Proposition ${LETTERS[index]} : ${choice}`}
                            accessibilityState={{selected: selectedIndex === index, disabled: isAnswered}}
                        >
                            <View className="duel-play-choice-badge" style={{backgroundColor: style.badgeBackgroundColor}}>
                                <Text className="duel-play-choice-badge-text" style={{color: style.badgeTextColor}}>
                                    {LETTERS[index]}
                                </Text>
                            </View>
                            <Text className="duel-play-choice-label" style={{color: style.textColor}}>
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
