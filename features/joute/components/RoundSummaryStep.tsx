import {Text, View} from "react-native";
import React, {useEffect} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {Question, Round} from "@/game/types";
import {impactMedium, notifyError, notifySuccess} from "@/lib/haptics";
import PrimaryButton from "@/components/PrimaryButton";
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
            if (myScore > opponentScore) notifySuccess();
            else if (myScore < opponentScore) notifyError();
            else impactMedium();
        } else {
            impactMedium();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [round.index]);

    return (
        <View className="gap-5">
            <View>
                <Text className="duel-recap-heading">{CATEGORY_LABELS[round.category]}</Text>
                <Text className="duel-recap-subheading">
                    Ton score sur cette manche : {myScore} / 3
                    {opponentHasPlayed ? ` · Adversaire : ${opponentScore} / 3` : ""}
                </Text>
            </View>

            <View className="gap-3">
                {questions.map((question) => {
                    const myAnswer = myAnswers.find((answer) => answer.questionId === question.id);
                    const opponentAnswer = opponentAnswers.find((answer) => answer.questionId === question.id);

                    return (
                        <View key={question.id} className="duel-recap-card">
                            <Text className="duel-recap-statement">{question.statement}</Text>
                            <Text className="duel-recap-answer">
                                Bonne réponse : {question.choices[question.correctIndex]}
                            </Text>
                            <Text className="duel-recap-explanation">{question.explanation}</Text>

                            <View className="duel-recap-footer">
                                <Text className={clsx("duel-recap-result", myAnswer?.isCorrect ? "duel-recap-correct" : "duel-recap-incorrect")}>
                                    {myAnswer?.isCorrect ? "✓ Toi" : "✕ Toi"}
                                </Text>
                                {opponentAnswer && (
                                    <Text
                                        className={clsx(
                                            "duel-recap-result",
                                            opponentAnswer.isCorrect ? "duel-recap-correct" : "duel-recap-incorrect",
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

            <PrimaryButton title="Continuer" onPress={onContinue} />
        </View>
    );
};

export default RoundSummaryStep;
