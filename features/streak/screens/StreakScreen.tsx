import {Pressable, ScrollView, Text} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {Question} from "@/game/types";
import {DRAWABLE_CATEGORIES, isQuestionUsable} from "@/game/rules";
import {ALL_QUESTIONS} from "@/data/questions";
import {StreakAnswer, computeCurrentStreak} from "@/game/streakEngine";
import {XP_PER_CORRECT_STREAK} from "@/game/gamification";
import {localGamificationRepository} from "@/services/localGamificationRepository";
import {localStreakStatsRepository} from "@/services/localStreakStatsRepository";
import StreakQuestionCard from "../components/StreakQuestionCard";
import StreakResultCard from "../components/StreakResultCard";

const SafeAreaView = styled(RNSafeAreaView);

function drawNextQuestion(excludeIds: readonly string[]): Question {
    const pool = ALL_QUESTIONS.filter((question) => DRAWABLE_CATEGORIES.includes(question.category) && isQuestionUsable(question));
    const candidates = pool.filter((question) => !excludeIds.includes(question.id));
    const source = candidates.length > 0 ? candidates : pool;
    return source[Math.floor(Math.random() * source.length)];
}

const StreakScreen = () => {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>(() => [drawNextQuestion([])]);
    const [answers, setAnswers] = useState<StreakAnswer[]>([]);
    const [phase, setPhase] = useState<"playing" | "results">("playing");
    const [bestStreak, setBestStreak] = useState(0);
    const hasRecordedRef = useRef(false);

    useEffect(() => {
        localStreakStatsRepository.get().then((stats) => setBestStreak(stats.bestStreak));
    }, []);

    const currentQuestion = questions[answers.length];
    const streakCount = computeCurrentStreak(answers);

    const handleAnswer = (submittedText: string, usedHint: boolean, elapsedMs: number, isCorrect: boolean) => {
        if (!currentQuestion) return;
        setAnswers((previous) => [...previous, {questionId: currentQuestion.id, submittedText, isCorrect, usedHint, elapsedMs}]);
    };

    const handleContinue = () => {
        const lastAnswer = answers[answers.length - 1];
        if (!lastAnswer?.isCorrect) {
            setPhase("results");
            return;
        }
        setQuestions((previous) => [...previous, drawNextQuestion(previous.map((question) => question.id))]);
    };

    const handleClose = () => router.back();

    const handleReplay = () => {
        setQuestions([drawNextQuestion([])]);
        setAnswers([]);
        setPhase("playing");
        hasRecordedRef.current = false;
    };

    const handleBackToHub = () => router.replace("/(tabs)/joute");

    useEffect(() => {
        if (phase !== "results" || hasRecordedRef.current) return;
        hasRecordedRef.current = true;

        const finalStreak = computeCurrentStreak(answers);
        localStreakStatsRepository.recordRun(finalStreak).then((stats) => setBestStreak(stats.bestStreak));
        localGamificationRepository.awardXp(finalStreak * XP_PER_CORRECT_STREAK);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    if (phase === "results") {
        const finalStreak = computeCurrentStreak(answers);
        return (
            <SafeAreaView className="flex-1 bg-plateau-violet p-5">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
                    <StreakResultCard
                        finalStreak={finalStreak}
                        bestStreak={bestStreak}
                        xpEarned={finalStreak * XP_PER_CORRECT_STREAK}
                        onReplay={handleReplay}
                        onBackToHub={handleBackToHub}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!currentQuestion) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-violet p-5">
                <Text className="home-empty-state text-plateau-cream">Impossible de charger cette question.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-plateau-violet p-5">
            <Pressable className="duel-close-button" onPress={handleClose} accessibilityRole="button" accessibilityLabel="Quitter">
                <Text className="duel-close-icon">✕</Text>
            </Pressable>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6 flex-grow" keyboardShouldPersistTaps="handled">
                <StreakQuestionCard question={currentQuestion} streakCount={streakCount} onAnswer={handleAnswer} onContinue={handleContinue} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default StreakScreen;
