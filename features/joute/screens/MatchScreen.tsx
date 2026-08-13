import {Pressable, Share, Text, View} from "react-native";
import React, {useEffect} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {Category, QUESTIONS_PER_ROUND} from "@/game/types";
import {chooseCategory, resolveTurn, submitAnswer} from "@/game/engine";
import {computeScore, drawCategoryOptions, pickQuestions} from "@/game/rules";
import {ALL_QUESTIONS} from "@/data/questions";
import {formatTimeRemaining} from "@/lib/utils";
import {buildInvitationLink} from "@/services/invitations";
import {useMatch} from "../hooks/useMatch";
import {useCurrentPlayer} from "../hooks/useCurrentPlayer";
import CategoryChoiceStep from "../components/CategoryChoiceStep";
import QuestionStep from "../components/QuestionStep";
import RoundSummaryStep from "../components/RoundSummaryStep";
import MatchHeader from "../components/MatchHeader";
import MatchWaitingCard from "../components/MatchWaitingCard";

const SafeAreaView = styled(RNSafeAreaView);

export interface MatchScreenProps {
    matchId: string;
}

const MatchScreen = ({matchId}: MatchScreenProps) => {
    const {id: myId} = useCurrentPlayer();
    const router = useRouter();
    const {match, isLoading, saveMatch} = useMatch(matchId);
    const goBack = () => router.back();

    useEffect(() => {
        if (match && (match.status === "completed" || match.status === "expired")) {
            router.replace(`/joute/${match.id}/result`);
        }
    }, [match, router]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="duel-skeleton" />
                <View className="duel-skeleton mt-4 h-40" />
            </SafeAreaView>
        );
    }

    if (!match) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <MatchHeader onBack={goBack} title="Partie introuvable" />
                <Text className="duel-empty-state">Cette partie n&#39;existe plus ou a été supprimée.</Text>
            </SafeAreaView>
        );
    }

    const opponent = match.players.find((player) => player.id !== myId) ?? match.players[1];
    const me = match.players.find((player) => player.id === myId) ?? match.players[0];

    if (match.status === "pending") {
        const handleReshare = async () => {
            if (!match.invitationCode) return;
            try {
                await Share.share({message: `Rejoins mon défi Joute ! ${buildInvitationLink(match.invitationCode)}`});
            } catch {
                // Partage annulé ou indisponible.
            }
        };

        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <MatchHeader onBack={goBack} title="Invitation en attente" />
                <MatchWaitingCard
                    me={me}
                    opponent={opponent}
                    myScore={computeScore(match, myId)}
                    opponentScore={computeScore(match, opponent.id)}
                    label="En attente qu'un ami rejoigne"
                    meta={match.invitationCode ? `Code ${match.invitationCode}` : undefined}
                    onBackHome={() => router.replace("/(tabs)")}
                >
                    {match.invitationCode && (
                        <Pressable className="duel-lobby-secondary-button" onPress={handleReshare} accessibilityRole="button">
                            <Text className="duel-lobby-secondary-text">Repartager le lien</Text>
                        </Pressable>
                    )}
                </MatchWaitingCard>
            </SafeAreaView>
        );
    }

    if (match.status === "completed" || match.status === "expired") {
        // Redirection vers l'écran de résultat déclenchée par le useEffect ci-dessus.
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="duel-skeleton" />
            </SafeAreaView>
        );
    }

    // match.status === "active"
    if (match.currentTurnPlayerId !== myId) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <MatchHeader onBack={goBack} title="En attente" />
                <MatchWaitingCard
                    me={me}
                    opponent={opponent}
                    myScore={computeScore(match, myId)}
                    opponentScore={computeScore(match, opponent.id)}
                    label={`C'est au tour de ${opponent.displayName}`}
                    meta={formatTimeRemaining(match.expiresAt)}
                    onBackHome={() => router.replace("/(tabs)")}
                />
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
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <Pressable className="duel-close-button" onPress={goBack} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <View className="mt-5">
                    <CategoryChoiceStep options={options} roundNumber={match.currentRoundIndex + 1} onChoose={handleChooseCategory} />
                </View>
            </SafeAreaView>
        );
    }

    const myAnsweredIds = new Set(round.answers.filter((answer) => answer.playerId === myId).map((answer) => answer.questionId));
    const nextQuestionId = round.questionIds.find((id) => !myAnsweredIds.has(id));

    if (nextQuestionId) {
        const question = ALL_QUESTIONS.find((candidate) => candidate.id === nextQuestionId);
        if (!question) {
            return (
                <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                    <MatchHeader onBack={goBack} title="Erreur" />
                    <Text className="duel-empty-state">Impossible de charger cette question.</Text>
                </SafeAreaView>
            );
        }

        const handleAnswer = async (selectedIndex: number | null, elapsedMs: number) => {
            const updated = submitAnswer({match, playerId: myId, question, selectedIndex, elapsedMs});
            await saveMatch(updated);
        };

        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <QuestionStep
                    question={question}
                    questionNumber={myAnsweredIds.size + 1}
                    roundNumber={match.currentRoundIndex + 1}
                    me={me}
                    opponent={opponent}
                    myScore={computeScore(match, myId)}
                    opponentScore={computeScore(match, opponent.id)}
                    onClose={goBack}
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
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <Pressable className="duel-close-button" onPress={goBack} accessibilityRole="button" accessibilityLabel="Retour">
                <Text className="duel-close-icon">←</Text>
            </Pressable>
            <View className="mt-5">
                <RoundSummaryStep round={round} questions={roundQuestions} viewerId={myId} opponentId={opponent.id} onContinue={handleContinue} />
            </View>
        </SafeAreaView>
    );
};

export default MatchScreen;
