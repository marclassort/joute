import {ScrollView, Text} from "react-native";
import React, {useEffect, useMemo, useRef, useState} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {Category} from "@/game/types";
import {pickQuestions} from "@/game/rules";
import {ALL_QUESTIONS} from "@/data/questions";
import {buildSoloAnswer, computeAverageResponseMs, computeLongestCorrectStreak, computeSoloScore, SoloAnswer} from "@/game/soloEngine";
import {generateId} from "@/lib/utils";
import {SOLO_QUESTIONS_PER_SESSION} from "../constants";
import {useSoloStats} from "../hooks/useSoloStats";
import SoloQuestionCard from "../components/SoloQuestionCard";
import SoloResultCard from "../components/SoloResultCard";

const SafeAreaView = styled(RNSafeAreaView);

export interface SoloScreenProps {
    category: Category;
}

function drawQuestionIds(category: Category): string[] {
    return pickQuestions(ALL_QUESTIONS, category, SOLO_QUESTIONS_PER_SESSION, [], generateId("solo-seed"));
}

const SoloScreen = ({category}: SoloScreenProps) => {
    const router = useRouter();
    const {recordSession} = useSoloStats();

    const [questionIds, setQuestionIds] = useState<string[]>(() => drawQuestionIds(category));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<SoloAnswer[]>([]);
    const [phase, setPhase] = useState<"playing" | "results">("playing");
    const hasRecordedRef = useRef(false);

    const questions = useMemo(
        () => questionIds.map((id) => ALL_QUESTIONS.find((question) => question.id === id)).filter((q): q is NonNullable<typeof q> => !!q),
        [questionIds],
    );

    const handleClose = () => router.back();

    const handleAnswer = (selectedIndex: number | null, elapsedMs: number) => {
        const question = questions[currentIndex];
        if (!question) return;
        setAnswers((previous) => [...previous, buildSoloAnswer(question, selectedIndex, elapsedMs)]);
    };

    const handleContinue = () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex((index) => index + 1);
            return;
        }
        setPhase("results");
    };

    const handleReplay = () => {
        setQuestionIds(drawQuestionIds(category));
        setCurrentIndex(0);
        setAnswers([]);
        setPhase("playing");
        hasRecordedRef.current = false;
    };

    const handleBackToThemes = () => router.replace("/solo");

    useEffect(() => {
        if (phase !== "results" || hasRecordedRef.current) return;
        hasRecordedRef.current = true;
        recordSession(category, computeSoloScore(answers), answers.length);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (phase === "results") {
        return (
            <SafeAreaView className="flex-1 bg-plateau-cream p-5">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
                    <SoloResultCard
                        category={category}
                        score={computeSoloScore(answers)}
                        averageResponseMs={computeAverageResponseMs(answers)}
                        longestCorrectStreak={computeLongestCorrectStreak(answers)}
                        onReplay={handleReplay}
                        onBackToThemes={handleBackToThemes}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    const question = questions[currentIndex];

    if (!question) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-cream p-5">
                <Text className="home-empty-state">Impossible de charger cette question.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-plateau-cream p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6 flex-grow">
                <SoloQuestionCard
                    question={question}
                    questionNumber={currentIndex + 1}
                    totalQuestions={questions.length}
                    isLastQuestion={currentIndex + 1 === questions.length}
                    onClose={handleClose}
                    onAnswer={handleAnswer}
                    onContinue={handleContinue}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default SoloScreen;
