import {ScrollView, Text, View} from "react-native";
import React, {useMemo, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {ALL_QUESTIONS} from "@/data/questions";
import {computeScore} from "@/game/rules";
import {useMatch} from "../hooks/useMatch";
import {useCurrentPlayer} from "../hooks/useCurrentPlayer";
import {FlatQuestionEntry} from "../types";
import MatchHeader from "../components/MatchHeader";
import PlayersScoreRow from "../components/PlayersScoreRow";
import RoundRow from "../components/RoundRow";
import QuestionDetailModal from "../components/QuestionDetailModal";

const SafeAreaView = styled(RNSafeAreaView);

export interface RoundsScreenProps {
    matchId: string;
}

const RoundsScreen = ({matchId}: RoundsScreenProps) => {
    const {id: myId} = useCurrentPlayer();
    const router = useRouter();
    const {match, isLoading} = useMatch(matchId);
    const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(null);

    const opponent = match?.players.find((player) => player.id !== myId) ?? match?.players[1];
    const me = match?.players.find((player) => player.id === myId) ?? match?.players[0];

    const flatEntries: FlatQuestionEntry[] = useMemo(() => {
        if (!match || !opponent) return [];
        return match.rounds
            .slice()
            .sort((a, b) => a.index - b.index)
            .flatMap((round) =>
                round.questionIds
                    .map((questionId) => ALL_QUESTIONS.find((candidate) => candidate.id === questionId))
                    .filter((question): question is NonNullable<typeof question> => question !== undefined)
                    .map((question) => ({
                        round,
                        question,
                        myAnswer: round.answers.find((answer) => answer.playerId === myId && answer.questionId === question.id),
                        opponentAnswer: round.answers.find((answer) => answer.playerId === opponent.id && answer.questionId === question.id),
                    })),
            );
    }, [match, myId, opponent]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="duel-skeleton" />
                <View className="duel-skeleton mt-4 h-40" />
            </SafeAreaView>
        );
    }

    if (!match || !opponent || !me) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <MatchHeader onBack={() => router.back()} title="Détail des manches" />
                <Text className="duel-empty-state">Cette partie n&#39;existe plus ou a été supprimée.</Text>
            </SafeAreaView>
        );
    }

    let cursor = 0;

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <MatchHeader onBack={() => router.back()} title="Détail des manches" />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-6 pb-10">
                <PlayersScoreRow me={me} opponent={opponent} myScore={computeScore(match, myId)} opponentScore={computeScore(match, opponent.id)} />

                <View className="gap-4">
                    {match.rounds
                        .slice()
                        .sort((a, b) => a.index - b.index)
                        .map((round) => {
                            const entries = flatEntries.filter((entry) => entry.round.index === round.index);
                            const baseGlobalIndex = cursor;
                            cursor += entries.length;
                            const chooserName = round.chosenBy === myId ? "toi" : opponent.displayName;

                            return (
                                <RoundRow
                                    key={round.index}
                                    entries={entries}
                                    chooserName={chooserName}
                                    baseGlobalIndex={baseGlobalIndex}
                                    onPressQuestion={setOpenQuestionIndex}
                                />
                            );
                        })}
                </View>
            </ScrollView>

            <QuestionDetailModal
                visible={openQuestionIndex !== null}
                onClose={() => setOpenQuestionIndex(null)}
                entries={flatEntries}
                initialIndex={openQuestionIndex ?? 0}
                me={me}
                opponent={opponent}
            />
        </SafeAreaView>
    );
};

export default RoundsScreen;
