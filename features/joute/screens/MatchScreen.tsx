import {Text, View} from "react-native";
import React from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useUser} from "@clerk/expo";
import {useRouter} from "expo-router";
import {Category, ROUNDS_PER_MATCH, QUESTIONS_PER_ROUND} from "@/game/types";
import {chooseCategory, resolveTurn, submitAnswer} from "@/game/engine";
import {computeOutcomeForPlayer, computeScore, drawCategoryOptions, pickQuestions} from "@/game/rules";
import {ALL_QUESTIONS} from "@/data/questions";
import {formatTimeRemaining} from "@/lib/utils";
import {useMatch} from "../hooks/useMatch";
import CategoryChoiceStep from "../components/CategoryChoiceStep";
import QuestionStep from "../components/QuestionStep";
import RoundSummaryStep from "../components/RoundSummaryStep";
import MatchHeader from "../components/MatchHeader";

const SafeAreaView = styled(RNSafeAreaView);

export interface MatchScreenProps {
    matchId: string;
}

const MatchScreen = ({matchId}: MatchScreenProps) => {
    const {user} = useUser();
    const router = useRouter();
    const {match, isLoading, saveMatch} = useMatch(matchId);
    const myId = user?.id ?? "";
    const goBack = () => router.back();

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <View className="joute-skeleton" />
                <View className="joute-skeleton mt-4 h-40" />
            </SafeAreaView>
        );
    }

    if (!match) {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={goBack} title="Partie introuvable" />
                <Text className="home-empty-state">Cette partie n&#39;existe plus ou a été supprimée.</Text>
            </SafeAreaView>
        );
    }

    const opponent = match.players.find((player) => player.id !== myId) ?? match.players[1];
    const me = match.players.find((player) => player.id === myId) ?? match.players[0];

    if (match.status === "pending") {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={goBack} title="Invitation en attente" />
                <Text className="home-empty-state">En attente que ton ami rejoigne la partie.</Text>
            </SafeAreaView>
        );
    }

    if (match.status === "completed" || match.status === "expired") {
        const outcome = computeOutcomeForPlayer(match, myId);
        const verdictLabel = outcome === null ? "Partie annulée" : outcome === "draw" ? "Match nul" : outcome === "win" ? "Tu as gagné" : "Tu as perdu";
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={goBack} title="Partie terminée" />
                <View className="joute-card">
                    <Text className="joute-step-title">{verdictLabel}</Text>
                    <Text className="joute-step-subtitle">
                        {computeScore(match, myId)} - {computeScore(match, opponent.id)} contre {opponent.displayName}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // match.status === "active"
    if (match.currentTurnPlayerId !== myId) {
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={goBack} title="En attente de l'adversaire" />
                <Text className="home-empty-state">
                    C&#39;est au tour de {opponent.displayName}. {formatTimeRemaining(match.expiresAt)}.
                </Text>
            </SafeAreaView>
        );
    }

    const round = match.rounds[match.currentRoundIndex];

    const handleChooseCategory = async (category: Category) => {
        const seed = `${match.id}:${match.currentRoundIndex}:${category}`;
        const questionIds = pickQuestions(ALL_QUESTIONS, category, QUESTIONS_PER_ROUND, [], seed) as [string, string, string];
        const updated = chooseCategory({match, playerId: myId, category, questionIds});
        await saveMatch(updated);
    };

    if (!round) {
        const options = drawCategoryOptions(match, 3, `${match.id}:${match.currentRoundIndex}:choices`);
        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={goBack} title={`Manche ${match.currentRoundIndex + 1} sur ${ROUNDS_PER_MATCH}`} />
                <CategoryChoiceStep options={options} roundNumber={match.currentRoundIndex + 1} onChoose={handleChooseCategory} />
            </SafeAreaView>
        );
    }

    const myAnsweredIds = new Set(round.answers.filter((answer) => answer.playerId === myId).map((answer) => answer.questionId));
    const nextQuestionId = round.questionIds.find((id) => !myAnsweredIds.has(id));

    if (nextQuestionId) {
        const question = ALL_QUESTIONS.find((candidate) => candidate.id === nextQuestionId);
        if (!question) {
            return (
                <SafeAreaView className="flex-1 bg-background p-5">
                    <MatchHeader onBack={goBack} title="Erreur" />
                    <Text className="home-empty-state">Impossible de charger cette question.</Text>
                </SafeAreaView>
            );
        }

        const handleAnswer = async (selectedIndex: number | null, elapsedMs: number) => {
            const updated = submitAnswer({match, playerId: myId, question, selectedIndex, elapsedMs});
            await saveMatch(updated);
        };

        return (
            <SafeAreaView className="flex-1 bg-background p-5">
                <MatchHeader onBack={goBack} title={`${me.displayName} vs ${opponent.displayName}`} />
                <QuestionStep
                    question={question}
                    questionNumber={myAnsweredIds.size + 1}
                    roundNumber={match.currentRoundIndex + 1}
                    onAnswer={handleAnswer}
                />
            </SafeAreaView>
        );
    }

    const roundQuestions = round.questionIds
        .map((id) => ALL_QUESTIONS.find((candidate) => candidate.id === id))
        .filter((question): question is NonNullable<typeof question> => question !== undefined);

    const handleContinue = async () => {
        const resolved = resolveTurn(match);
        await saveMatch(resolved);
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <MatchHeader onBack={goBack} title="Fin de manche" />
            <RoundSummaryStep round={round} questions={roundQuestions} viewerId={myId} opponentId={opponent.id} onContinue={handleContinue} />
        </SafeAreaView>
    );
};

export default MatchScreen;
