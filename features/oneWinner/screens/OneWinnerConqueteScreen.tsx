import {Text, View} from "react-native";
import React, {useMemo, useRef, useState} from "react";
import PressableScale from "@/components/PressableScale";
import ShadowCard from "@/components/ShadowCard";
import {ALL_QUESTIONS} from "@/data/questions";
import {resolveChoiceStyle} from "@/game/choiceStyle";
import {OneWinnerAnswerSummary, OneWinnerGameSummary, SubmitOneWinnerAnswerInput} from "@/lib/oneWinnerApi";

export interface OneWinnerConqueteScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onAnswer: (input: SubmitOneWinnerAnswerInput) => Promise<OneWinnerAnswerSummary>;
}

const LETTERS = ["A", "B", "C", "D"];

function wagerOptionsFor(score: number): number[] {
    const base = Math.max(score, 0);
    const raw = [Math.max(10, Math.round(base * 0.2)), Math.max(30, Math.round(base * 0.5)), Math.max(50, base || 50)];
    return [...new Set(raw)].sort((a, b) => a - b);
}

const OneWinnerConqueteScreen = ({game, myId, onAnswer}: OneWinnerConqueteScreenProps) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const [wager, setWager] = useState<number | null>(null);
    const [result, setResult] = useState<{selectedIndex: number; isCorrect: boolean; pointsAwarded: number} | null>(null);
    const startedAtRef = useRef(Date.now());

    const questionIds = game.currentEpreuve?.questionIds ?? [];
    const question = ALL_QUESTIONS.find((q) => q.id === questionIds[questionIndex]);
    const myScore = game.liveStandings.find((standing) => standing.playerId === myId)?.score ?? 0;
    const wagerOptions = useMemo(() => wagerOptionsFor(myScore), [myScore]);

    if (!question) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="solo-hero-subtitle text-plateau-paper/60">En attente des autres joueurs…</Text>
            </View>
        );
    }

    const handleConfirmWager = (amount: number) => {
        setWager(amount);
        startedAtRef.current = Date.now();
    };

    const handleAnswer = async (index: number) => {
        if (wager === null || result) return;
        const elapsedMs = Date.now() - startedAtRef.current;
        const outcome = await onAnswer({questionId: question.id, selectedIndex: index, elapsedMs, wager});
        setResult({selectedIndex: index, isCorrect: outcome.isCorrect, pointsAwarded: outcome.pointsAwarded});
    };

    const handleContinue = () => {
        setQuestionIndex((i) => i + 1);
        setWager(null);
        setResult(null);
    };

    if (wager === null) {
        return (
            <View className="flex-1 items-center justify-center gap-6 px-2">
                <Text className="text-eyebrow text-plateau-brass">
                    La Conquête · question {questionIndex + 1} sur {questionIds.length}
                </Text>
                <Text className="solo-hero-title text-center text-plateau-paper">Misez avant de voir la question</Text>
                <Text className="solo-hero-subtitle text-center text-plateau-paper/60">Score actuel : {myScore} points</Text>
                <View className="one-winner-wager-row">
                    {wagerOptions.map((amount) => (
                        <PressableScale
                            key={amount}
                            className="one-winner-wager-chip"
                            onPress={() => handleConfirmWager(amount)}
                            accessibilityRole="button"
                            accessibilityLabel={`Miser ${amount} points`}
                        >
                            <Text className="one-winner-wager-chip-text">{amount} pts</Text>
                        </PressableScale>
                    ))}
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 gap-6">
            <View className="items-center gap-2">
                <Text className="text-eyebrow text-plateau-brass">Mise : {wager} pts</Text>
                <Text className="duel-question-statement text-center">{question.statement}</Text>
            </View>

            <View className="solo-choices">
                {question.choices.map((choice, index) => {
                    const style = resolveChoiceStyle(index, !!result, result?.selectedIndex ?? null, question.correctIndex);
                    return (
                        <PressableScale
                            key={choice}
                            activeScale={0.98}
                            className="solo-choice"
                            style={{backgroundColor: style.backgroundColor, borderColor: style.borderColor}}
                            onPress={() => handleAnswer(index)}
                            disabled={!!result}
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

            {result && (
                <View className="solo-footer">
                    <ShadowCard borderRadius={20} className="solo-cta-button">
                        <PressableScale activeScale={0.98} onPress={handleContinue} accessibilityRole="button">
                            <Text className="solo-cta-text">
                                {result.isCorrect ? `Bien joué, +${result.pointsAwarded} !` : `Perdu, ${result.pointsAwarded}`} · Continuer
                            </Text>
                        </PressableScale>
                    </ShadowCard>
                </View>
            )}
        </View>
    );
};

export default OneWinnerConqueteScreen;
