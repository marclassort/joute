import {Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import PressableScale from "@/components/PressableScale";
import {ALL_QUESTIONS} from "@/data/questions";
import {resolveChoiceStyle} from "@/game/choiceStyle";
import {plateauColors} from "@/constants/theme";
import {OneWinnerAnswerSummary, OneWinnerGameSummary, SubmitOneWinnerAnswerInput} from "@/lib/oneWinnerApi";

export interface OneWinnerBuzzerScreenProps {
    game: OneWinnerGameSummary;
    myId: string;
    onBuzz: (questionId: string) => Promise<void>;
    onAnswer: (input: SubmitOneWinnerAnswerInput) => Promise<OneWinnerAnswerSummary>;
}

const LETTERS = ["A", "B", "C", "D"];
const FEEDBACK_DURATION_MS = 1800;

const OneWinnerBuzzerScreen = ({game, myId, onBuzz, onAnswer}: OneWinnerBuzzerScreenProps) => {
    const [buzzError, setBuzzError] = useState<string | null>(null);
    const [isBuzzing, setIsBuzzing] = useState(false);
    const [feedback, setFeedback] = useState<OneWinnerAnswerSummary | null>(null);
    const startedAtRef = useRef(Date.now());
    const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const epreuve = game.currentEpreuve;
    const questionIds = epreuve?.questionIds ?? [];
    const resolvedIds = new Set((epreuve?.answers ?? []).filter((answer) => answer.isCorrect).map((answer) => answer.questionId));
    const currentQuestionId = questionIds.find((id) => !resolvedIds.has(id));
    const question = ALL_QUESTIONS.find((q) => q.id === currentQuestionId);

    useEffect(() => {
        startedAtRef.current = Date.now();
        setFeedback(null);
        setBuzzError(null);
    }, [currentQuestionId]);

    useEffect(() => () => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    }, []);

    if (!question || !epreuve) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="solo-hero-subtitle text-plateau-paper/60">En attente des autres joueurs…</Text>
            </View>
        );
    }

    const buzzHolderId = epreuve.buzzHolder;
    const buzzHolder = game.players.find((player) => player.id === buzzHolderId);
    const isMine = buzzHolderId === myId;
    const hasWrongAnswer = epreuve.answers.some((answer) => answer.playerId === myId && answer.questionId === question.id && !answer.isCorrect);

    const handleBuzz = async () => {
        setBuzzError(null);
        setIsBuzzing(true);
        try {
            await onBuzz(question.id);
        } catch (error) {
            setBuzzError((error as Error).message);
        } finally {
            setIsBuzzing(false);
        }
    };

    const handleAnswer = async (index: number) => {
        const elapsedMs = Date.now() - startedAtRef.current;
        const result = await onAnswer({questionId: question.id, selectedIndex: index, elapsedMs});
        setFeedback(result);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), FEEDBACK_DURATION_MS);
    };

    return (
        <View className="flex-1 gap-6">
            <View className="items-center gap-2">
                <Text className="text-eyebrow text-plateau-teal">Le Buzzer</Text>
                <Text className="duel-question-statement text-center">{question.statement}</Text>
            </View>

            {feedback ? (
                <View
                    className="one-winner-feedback-banner"
                    style={{backgroundColor: feedback.isCorrect ? plateauColors.teal : plateauColors.rose}}
                >
                    <Text className="one-winner-feedback-banner-text">
                        {feedback.isCorrect ? `Bonne réponse ! +${feedback.pointsAwarded}` : `Mauvaise réponse (${feedback.pointsAwarded})`}
                    </Text>
                </View>
            ) : isMine ? (
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
            ) : buzzHolder ? (
                <View className="items-center gap-2">
                    <Text className="solo-hero-subtitle text-plateau-paper/60">{buzzHolder.displayName} a la main…</Text>
                </View>
            ) : (
                <View className="items-center gap-3">
                    <PressableScale
                        activeScale={0.94}
                        className="one-winner-buzz-button"
                        onPress={handleBuzz}
                        disabled={isBuzzing || hasWrongAnswer}
                        accessibilityRole="button"
                        accessibilityLabel="Buzzer"
                    >
                        <Text className="one-winner-buzz-button-text">BUZZ</Text>
                    </PressableScale>
                    {hasWrongAnswer && <Text className="session-error text-center">Vous êtes temporairement bloqué.</Text>}
                    {buzzError && <Text className="session-error text-center">{buzzError}</Text>}
                </View>
            )}
        </View>
    );
};

export default OneWinnerBuzzerScreen;
