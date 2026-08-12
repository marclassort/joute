import {Image, Pressable, ScrollView, Text, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {Category} from "@/game/types";
import {
    availablePlateauCategories,
    canPlayerOpenRound,
    computePlateauActivity,
    computePlateauScore,
    computePlateauStandings,
    openPlateauRound,
    submitPlateauAnswer,
} from "@/game/plateauEngine";
import {pickQuestions} from "@/game/rules";
import {ALL_QUESTIONS} from "@/data/questions";
import {CATEGORY_LABELS} from "@/features/joute/constants";
import HardShadowCard from "@/features/joute/components/HardShadowCard";
import CategoryChoiceStep from "@/features/joute/components/CategoryChoiceStep";
import SoloQuestionCard from "@/features/solo/components/SoloQuestionCard";
import {plateauColors} from "@/constants/theme";
import {formatRelativeTime} from "@/lib/utils";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {XP_PER_CORRECT_PLATEAU, XP_PLATEAU_WIN_BONUS} from "@/game/gamification";
import {localGamificationRepository} from "@/services/localGamificationRepository";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {usePlateauMatch} from "../hooks/usePlateauMatch";
import PlateauTrackRow from "../components/PlateauTrackRow";

const SafeAreaView = styled(RNSafeAreaView);

const PLAYER_COLORS = [plateauColors.violet, plateauColors.pink, plateauColors.cyan, plateauColors.gold, plateauColors.orange, plateauColors.lime];

export interface PlateauBoardScreenProps {
    matchId: string;
}

const PlateauBoardScreen = ({matchId}: PlateauBoardScreenProps) => {
    const router = useRouter();
    const {id: myId} = useCurrentPlayer();
    const {match, isLoading, saveMatch} = usePlateauMatch(matchId);
    const [phase, setPhase] = useState<"board" | "category" | "question">("board");
    const [questionIndex, setQuestionIndex] = useState(0);
    const hasAwardedRef = useRef(false);

    useEffect(() => {
        if (!match || match.status !== "completed" || hasAwardedRef.current) return;
        hasAwardedRef.current = true;

        const won = computePlateauStandings(match)[0]?.player.id === myId;
        const xp = computePlateauScore(match, myId) * XP_PER_CORRECT_PLATEAU + (won ? XP_PLATEAU_WIN_BONUS : 0);
        localGamificationRepository.awardXpForMatch(match.id, xp);
    }, [match, myId]);

    if (isLoading || !match) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="joute-skeleton" />
            </SafeAreaView>
        );
    }

    const standings = computePlateauStandings(match);
    const activity = computePlateauActivity(match).slice(0, 5);
    const myRound = [...match.rounds].reverse().find((round) => round.playerId === myId);
    const hasIncompleteRound = !!myRound && myRound.answers.length < myRound.questionIds.length;
    const canPlay = match.status === "active" && (hasIncompleteRound || canPlayerOpenRound(match, myId));

    const goBack = () => router.back();

    const handlePressPlay = () => {
        setPhase(hasIncompleteRound ? "question" : "category");
        setQuestionIndex(myRound ? myRound.answers.length : 0);
    };

    const handleChooseCategory = async (category: Category) => {
        const seed = `${match.id}:${myId}:${match.rounds.length}:${category}`;
        const questionIds = pickQuestions(ALL_QUESTIONS, category, 3, [], seed) as [string, string, string];
        const updated = openPlateauRound({match, playerId: myId, category, questionIds});
        await saveMatch(updated);
        setQuestionIndex(0);
        setPhase("question");
    };

    if (phase === "category") {
        const options = availablePlateauCategories(match);
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <Pressable className="duel-close-button" onPress={() => setPhase("board")} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <View className="mt-5">
                    <CategoryChoiceStep options={options} roundNumber={match.rounds.filter((r) => r.playerId === myId).length + 1} onChoose={handleChooseCategory} />
                </View>
            </SafeAreaView>
        );
    }

    if (phase === "question") {
        const currentRound = [...match.rounds].reverse().find((round) => round.playerId === myId);
        const question = currentRound ? ALL_QUESTIONS.find((candidate) => candidate.id === currentRound.questionIds[questionIndex]) : undefined;

        if (!currentRound || !question) {
            return (
                <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                    <Text className="home-empty-state text-plateau-cream">Impossible de charger cette question.</Text>
                </SafeAreaView>
            );
        }

        const handleAnswer = async (selectedIndex: number | null, elapsedMs: number) => {
            const updated = submitPlateauAnswer({match, playerId: myId, question, selectedIndex, elapsedMs});
            await saveMatch(updated);
        };

        const handleContinue = () => {
            if (questionIndex + 1 < currentRound.questionIds.length) {
                setQuestionIndex((index) => index + 1);
                return;
            }
            setPhase("board");
        };

        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6 flex-grow">
                    <SoloQuestionCard
                        question={question}
                        questionNumber={questionIndex + 1}
                        totalQuestions={currentRound.questionIds.length}
                        isLastQuestion={questionIndex + 1 === currentRound.questionIds.length}
                        onClose={() => setPhase("board")}
                        onAnswer={handleAnswer}
                        onContinue={handleContinue}
                    />
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <View className="duel-header">
                <Pressable className="duel-close-button" onPress={goBack} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <View className="items-center">
                    <Text className="plateau-header-title">Le Plateau</Text>
                    <Text className="plateau-header-subtitle">
                        {match.players.length} joueurs · course à 24 pts
                    </Text>
                </View>
                <View className="size-9" />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
                {match.status === "completed" && (
                    <View className="mt-5 items-center rounded-2xl bg-plateau-lime p-4">
                        <Text className="font-display text-sm text-plateau-ink">
                            Partie terminée · {standings[0]?.player.displayName} remporte le plateau
                        </Text>
                    </View>
                )}

                {canPlay && match.status === "active" && (
                    <View className="plateau-turn-pill mt-5">
                        <Text className="plateau-turn-pill-text">{hasIncompleteRound ? "Manche en cours ⏱" : "À toi de jouer"}</Text>
                    </View>
                )}

                <View className="plateau-track-card">
                    <Text className="plateau-track-label">Piste · premier à 24 pts</Text>
                    <View className="gap-[14px]">
                        {standings.map(({player, score}, index) => (
                            <PlateauTrackRow
                                key={player.id}
                                player={player}
                                score={score}
                                color={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                                isMe={player.id === myId}
                            />
                        ))}
                    </View>
                </View>

                <Text className="plateau-activity-label">Ça bouge sur le plateau</Text>
                <View className="gap-[9px]">
                    {activity.map((entry, index) => {
                        const player = match.players.find((candidate) => candidate.id === entry.playerId);
                        if (!player) return null;

                        const label =
                            entry.kind === "round-completed"
                                ? `a fait ${entry.correctCount}/3 en ${CATEGORY_LABELS[entry.category]}`
                                : entry.kind === "round-opened"
                                  ? `a choisi le thème ${CATEGORY_LABELS[entry.category]}`
                                  : "doit encore jouer sa manche";

                        return (
                            <View key={`${entry.playerId}-${entry.kind}-${index}`} className="plateau-activity-row">
                                {player.avatarUrl ? (
                                    <Image source={{uri: player.avatarUrl}} className="plateau-activity-avatar" />
                                ) : (
                                    <View
                                        className="plateau-activity-avatar"
                                        style={{backgroundColor: PLAYER_COLORS[match.players.indexOf(player) % PLAYER_COLORS.length]}}
                                    />
                                )}
                                <Text className="plateau-activity-text">
                                    <Text className="plateau-activity-name">{player.displayName}</Text> {label}
                                </Text>
                                <Text className={clsx("plateau-activity-time", entry.kind === "not-played-yet" && "plateau-activity-time-alert")}>
                                    {formatRelativeTime(entry.at)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {canPlay && match.status === "active" && (
                <View className="pt-3">
                    <HardShadowCard borderRadius={20} offsetY={5} className="plateau-cta-button">
                        <Pressable onPress={handlePressPlay} accessibilityRole="button">
                            <Text className="plateau-cta-text">{hasIncompleteRound ? "Continuer ma manche" : "Jouer ma manche"}</Text>
                        </Pressable>
                    </HardShadowCard>
                </View>
            )}
        </SafeAreaView>
    );
};

export default PlateauBoardScreen;
