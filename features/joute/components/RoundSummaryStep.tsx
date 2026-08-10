import {Pressable, Text, View} from "react-native";
import React, {useEffect} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import * as Haptics from "expo-haptics";
import {Question, Round} from "@/game/types";
import {CATEGORY_LABELS} from "../constants";

export interface RoundSummaryStepProps {
    round: Round;
    questions: Question[];
    viewerId: string;
    opponentId: string;
    onContinue: () => void;
}

const RoundSummaryStep = ({round, questions, viewerId, opponentId, onContinue}: RoundSummaryStepProps) => {
    const myAnswers = round.answers.filter((answer) => answer.playerId === viewerId);
    const opponentAnswers = round.answers.filter((answer) => answer.playerId === opponentId);
    const opponentHasPlayed = opponentAnswers.length > 0;

    const myScore = myAnswers.filter((answer) => answer.isCorrect).length;
    const opponentScore = opponentAnswers.filter((answer) => answer.isCorrect).length;

    useEffect(() => {
        if (opponentHasPlayed) {
            if (myScore > opponentScore) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            else if (myScore < opponentScore) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round.index]);

    return (
        <View className="gap-5">
            <View>
                <Text className="joute-step-title">{CATEGORY_LABELS[round.category]}</Text>
                <Text className="joute-step-subtitle">
                    Ton score sur cette manche : {myScore} / 3
                    {opponentHasPlayed ? ` · Adversaire : ${opponentScore} / 3` : ""}
                </Text>
            </View>

            <View className="gap-3">
                {questions.map((question) => {
                    const myAnswer = myAnswers.find((answer) => answer.questionId === question.id);
                    const opponentAnswer = opponentAnswers.find((answer) => answer.questionId === question.id);

                    return (
                        <View key={question.id} className="joute-recap-card">
                            <Text className="joute-recap-statement">{question.statement}</Text>
                            <Text className="joute-recap-answer">
                                Bonne réponse : {question.choices[question.correctIndex]}
                            </Text>
                            <Text className="joute-recap-explanation">{question.explanation}</Text>

                            <View className="joute-recap-footer">
                                <Text className={clsx("joute-recap-result", myAnswer?.isCorrect ? "joute-recap-correct" : "joute-recap-incorrect")}>
                                    {myAnswer?.isCorrect ? "✓ Toi" : "✕ Toi"}
                                </Text>
                                {opponentAnswer && (
                                    <Text
                                        className={clsx(
                                            "joute-recap-result",
                                            opponentAnswer.isCorrect ? "joute-recap-correct" : "joute-recap-incorrect",
                                        )}
                                    >
                                        {opponentAnswer.isCorrect ? "✓ Adversaire" : "✕ Adversaire"}
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            <Pressable className="joute-new-match-button" onPress={onContinue} accessibilityRole="button">
                <Text className="joute-new-match-text">Continuer</Text>
            </Pressable>
        </View>
    );
};

export default RoundSummaryStep;
