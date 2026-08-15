import {Text, View} from "react-native";
import React, {useState} from "react";
import SoloQuestionCard from "@/features/solo/components/SoloQuestionCard";
import {ALL_QUESTIONS} from "@/data/questions";
import {OneWinnerGameSummary, SubmitOneWinnerAnswerInput} from "@/lib/oneWinnerApi";

export interface OneWinnerEpreuveScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onAnswer: (input: SubmitOneWinnerAnswerInput) => void;
    onClose: () => void;
}

const OneWinnerDefiScreen = ({game, myId, onAnswer, onClose}: OneWinnerEpreuveScreenProps) => {
    const [questionIndex, setQuestionIndex] = useState(0);
    const questionIds = game.currentEpreuve?.questionIds ?? [];
    const question = ALL_QUESTIONS.find((q) => q.id === questionIds[questionIndex]);

    const myScore = (game.currentEpreuve?.answers ?? [])
        .filter((answer) => answer.playerId === myId)
        .reduce((sum, answer) => sum + answer.pointsAwarded, 0);

    if (!question) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="solo-hero-subtitle text-plateau-paper/60">En attente des autres joueurs…</Text>
            </View>
        );
    }

    return (
        <SoloQuestionCard
            question={question}
            questionNumber={questionIndex + 1}
            totalQuestions={questionIds.length}
            score={myScore}
            isLastQuestion={questionIndex === questionIds.length - 1}
            onClose={onClose}
            onAnswer={(selectedIndex, elapsedMs) => onAnswer({questionId: question.id, selectedIndex, elapsedMs})}
            onContinue={() => setQuestionIndex((i) => i + 1)}
        />
    );
};

export default OneWinnerDefiScreen;
