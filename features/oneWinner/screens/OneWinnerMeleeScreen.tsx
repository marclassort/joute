import {Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import PressableScale from "@/components/PressableScale";
import {ALL_QUESTIONS} from "@/data/questions";
import {resolveChoiceStyle} from "@/game/choiceStyle";
import {MELEE_SPEED_POINTS, MELEE_TIME_LIMIT_MS} from "@/game/oneWinnerConfig";
import {plateauColors} from "@/constants/theme";
import {OneWinnerGameSummary, SubmitMeleeAnswerInput} from "@/lib/oneWinnerApi";

export interface OneWinnerMeleeScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onAnswer: (input: SubmitMeleeAnswerInput) => Promise<{isCorrect: boolean; pointsAwarded: number}>;
}

const LETTERS = ["A", "B", "C", "D"];
const RANK_LABELS = ["1ᵉʳ", "2ᵉ", "3ᵉ", "4ᵉ"];

const OneWinnerMeleeScreen = ({game, myId, onAnswer}: OneWinnerMeleeScreenProps) => {
    const [feedback, setFeedback] = useState<{isCorrect: boolean; pointsAwarded: number} | null>(null);
    const [remainingSec, setRemainingSec] = useState(0);
    const startedAtRef = useRef(Date.now());

    const round = game.currentRound;
    const current = round?.openedQuestions[round.openedQuestions.length - 1] ?? null;
    const question = current ? ALL_QUESTIONS.find((q) => q.id === current.questionId) : undefined;
    const myAnswer = round?.answers.find((answer) => answer.playerId === myId && answer.questionId === current?.questionId);

    useEffect(() => {
        setFeedback(null);
        startedAtRef.current = Date.now();
    }, [current?.questionId]);

    useEffect(() => {
        if (!current) return undefined;
        const tick = () => setRemainingSec(Math.ceil(Math.max(0, MELEE_TIME_LIMIT_MS - (Date.now() - current.openedAt)) / 1000));
        tick();
        const interval = setInterval(tick, 250);
        return () => clearInterval(interval);
    }, [current]);

    if (!question || !current) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="solo-hero-subtitle text-plateau-paper/60">En attente des autres joueurs…</Text>
            </View>
        );
    }

    const answered = !!myAnswer || !!feedback;
    const myRankIndex = feedback?.isCorrect ? MELEE_SPEED_POINTS.indexOf(feedback.pointsAwarded) : -1;

    const handleAnswer = async (index: number) => {
        if (answered) return;
        const elapsedMs = Date.now() - startedAtRef.current;
        const result = await onAnswer({questionId: question.id, selectedIndex: index, elapsedMs});
        setFeedback(result);
    };

    return (
        <View className="flex-1 gap-4">
            <View className="flex-row gap-[6px]">
                {MELEE_SPEED_POINTS.map((points, index) => (
                    <View key={points} className={index === myRankIndex ? "one-winner-melee-tier one-winner-melee-tier-active" : "one-winner-melee-tier"}>
                        <Text className={index === myRankIndex ? "one-winner-melee-tier-points one-winner-melee-tier-points-active" : "one-winner-melee-tier-points"}>
                            +{points}
                        </Text>
                        <Text className={index === myRankIndex ? "one-winner-melee-tier-rank one-winner-melee-tier-rank-active" : "one-winner-melee-tier-rank"}>
                            {RANK_LABELS[index]}
                        </Text>
                    </View>
                ))}
            </View>

            <View className="items-center gap-2">
                <Text className="text-eyebrow text-plateau-teal">Tout le monde répond · {remainingSec} s</Text>
                <Text className="duel-question-statement text-center">{question.statement}</Text>
            </View>

            {feedback ? (
                <View className="one-winner-feedback-banner" style={{backgroundColor: feedback.isCorrect ? plateauColors.teal : plateauColors.rose}}>
                    <Text className="one-winner-feedback-banner-text">
                        {feedback.isCorrect ? `Bonne réponse ! +${feedback.pointsAwarded}` : "Mauvaise réponse"}
                    </Text>
                </View>
            ) : (
                <View className="solo-choices">
                    {question.choices.map((choice, index) => {
                        const style = resolveChoiceStyle(index, false, null, question.correctIndex);
                        return (
                            <PressableScale
                                key={choice}
                                activeScale={0.98}
                                className="solo-choice"
                                style={{backgroundColor: style.backgroundColor, borderColor: style.borderColor}}
                                onPress={() => handleAnswer(index)}
                                accessibilityRole="button"
                                accessibilityLabel={`Proposition ${LETTERS[index]} : ${choice}`}
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
            )}

            {answered && <Text className="solo-hero-subtitle text-center text-plateau-paper/60">En attente des autres joueurs…</Text>}
        </View>
    );
};

export default OneWinnerMeleeScreen;
