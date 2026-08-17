import {Pressable, Text, View} from "react-native";
import React, {useEffect, useRef} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {goBackOrHome} from "@/lib/navigation";
import {useOneWinnerGame} from "../hooks/useOneWinnerGame";
import {useDevGhostAutoplay} from "../hooks/useDevGhostAutoplay";
import OneWinnerWaitingRoomScreen from "./OneWinnerWaitingRoomScreen";
import OneWinnerIntroStageScreen from "./OneWinnerIntroStageScreen";
import OneWinnerMeleeScreen from "./OneWinnerMeleeScreen";
import OneWinnerChargeThemeScreen from "./OneWinnerChargeThemeScreen";
import OneWinnerChargeScreen from "./OneWinnerChargeScreen";
import OneWinnerJouteScreen from "./OneWinnerJouteScreen";
import OneWinnerClassementScreen from "./OneWinnerClassementScreen";
import OneWinnerEliminationScreen from "./OneWinnerEliminationScreen";
import OneWinnerVictoryScreen from "./OneWinnerVictoryScreen";
import {ALL_QUESTIONS} from "@/data/questions";
import {ALL_RIDDLES} from "@/data/riddles";
import {pickJouteQuestions, pickMeleeQuestions} from "@/game/oneWinnerQuestionPicker";
import {CHARGE_TIME_LIMIT_MS, JOUTE_QUESTION_TIME_MS, MELEE_TIME_LIMIT_MS} from "@/game/oneWinnerConfig";

const SafeAreaView = styled(RNSafeAreaView);

export interface OneWinnerGameScreenProps {
    gameId: string;
}

const INTRO_DELAY_MS = 2600;
const CLASSEMENT_DELAY_MS = 3200;
const ELIMINATION_DELAY_MS = 3200;
// Marge après une échéance serveur (openedAt/startedAt + délai) avant que l'hôte force l'avancée — le
// temps que la dernière réponse d'un joueur arrive et soit prise en compte côté serveur.
const ADVANCE_BUFFER_MS = 300;

const OneWinnerGameScreen = ({gameId}: OneWinnerGameScreenProps) => {
    const router = useRouter();
    const {game, isLoading, error, myId, isHost, canStart, isStarting, start, startRound, advance, answerMelee, chooseChargeTheme, answerCharge, answerJoute} =
        useOneWinnerGame(gameId);
    const {spawnGhosts} = useDevGhostAutoplay(gameId, game);

    const inFlightRef = useRef(false);
    const usedMeleeIdsRef = useRef<Set<string>>(new Set());
    const usedJouteIdsRef = useRef<Set<string>>(new Set());

    // Hôte : lance la manche courante après une courte intro, puis l'avance/la conclut selon des
    // échéances fixées côté SERVEUR (openedAt/startedAt), jamais un délai client arbitraire — pour
    // rester fidèle aux temps impartis (10 s Mêlée, 60 s Charge, 20 s Joute).
    useEffect(() => {
        if (!isHost || !game || inFlightRef.current) return undefined;

        const runOnce = (action: () => Promise<void>) => {
            inFlightRef.current = true;
            action().finally(() => {
                inFlightRef.current = false;
            });
        };

        if (game.phase === "intro") {
            const timeout = setTimeout(() => {
                if (game.roundId === "melee") {
                    const ids = pickMeleeQuestions(ALL_QUESTIONS, [...usedMeleeIdsRef.current]);
                    ids.forEach((id) => usedMeleeIdsRef.current.add(id));
                    runOnce(() => startRound(ids));
                } else if (game.roundId === "charge") {
                    runOnce(() => startRound());
                } else {
                    const ids = pickJouteQuestions(ALL_RIDDLES, [...usedJouteIdsRef.current]);
                    ids.forEach((id) => usedJouteIdsRef.current.add(id));
                    runOnce(() => startRound(ids));
                }
            }, INTRO_DELAY_MS);
            return () => clearTimeout(timeout);
        }

        if (game.phase === "melee" && game.currentRound) {
            const current = game.currentRound.openedQuestions[game.currentRound.openedQuestions.length - 1];
            if (!current) return undefined;
            const activeIds = game.players.filter((player) => !player.isEliminated).map((player) => player.id);
            const answeredIds = new Set(game.currentRound.answers.filter((answer) => answer.questionId === current.questionId).map((answer) => answer.playerId));
            if (activeIds.every((id) => answeredIds.has(id))) {
                runOnce(() => advance());
                return undefined;
            }
            const timeout = setTimeout(() => runOnce(() => advance()), Math.max(0, current.openedAt + MELEE_TIME_LIMIT_MS - Date.now()) + ADVANCE_BUFFER_MS);
            return () => clearTimeout(timeout);
        }

        if (game.phase === "charge-theme") {
            const activePlayers = game.players.filter((player) => !player.isEliminated);
            if (activePlayers.every((player) => player.chargeTheme !== null)) {
                runOnce(() => advance());
            }
            return undefined;
        }

        if (game.phase === "charge" && game.currentRound) {
            const deadline = game.currentRound.startedAt + CHARGE_TIME_LIMIT_MS;
            const timeout = setTimeout(() => runOnce(() => advance()), Math.max(0, deadline - Date.now()) + ADVANCE_BUFFER_MS);
            return () => clearTimeout(timeout);
        }

        if (game.phase === "joute" && game.currentRound) {
            const current = game.currentRound.openedQuestions[game.currentRound.openedQuestions.length - 1];
            if (!current) return undefined;
            const alreadyResolved = game.currentRound.answers.some((answer) => answer.questionId === current.questionId && answer.isCorrect);
            if (alreadyResolved) return undefined;
            const timeout = setTimeout(
                () => runOnce(() => advance()),
                Math.max(0, current.openedAt + JOUTE_QUESTION_TIME_MS - Date.now()) + ADVANCE_BUFFER_MS,
            );
            return () => clearTimeout(timeout);
        }

        if (game.phase === "classement") {
            const timeout = setTimeout(() => runOnce(() => advance()), CLASSEMENT_DELAY_MS);
            return () => clearTimeout(timeout);
        }

        if (game.phase === "elimination") {
            const timeout = setTimeout(() => runOnce(() => advance()), ELIMINATION_DELAY_MS);
            return () => clearTimeout(timeout);
        }

        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, game]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="joute-skeleton" />
            </SafeAreaView>
        );
    }

    if (error || !game || !myId) {
        return (
            <SafeAreaView className="flex-1 bg-plateau-ink p-5">
                <View className="duel-header">
                    <Pressable className="duel-close-button" onPress={() => goBackOrHome(router)} accessibilityRole="button" accessibilityLabel="Retour">
                        <Text className="duel-close-icon">←</Text>
                    </Pressable>
                    <Text className="duel-header-title">Un seul gagnant</Text>
                    <View className="size-9" />
                </View>
                <Text className="home-empty-state mt-6 text-center text-plateau-paper/60">{error ?? "Partie introuvable."}</Text>
            </SafeAreaView>
        );
    }

    const currentQuestionId = game.currentRound?.openedQuestions[game.currentRound.openedQuestions.length - 1]?.questionId ?? null;

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            {game.phase !== "termine" && (
                <View className="duel-header">
                    <Pressable className="duel-close-button" onPress={() => goBackOrHome(router)} accessibilityRole="button" accessibilityLabel="Retour">
                        <Text className="duel-close-icon">←</Text>
                    </Pressable>
                    <Text className="duel-header-title">{game.phase === "lobby" ? "Salle d'attente" : "Un seul gagnant"}</Text>
                    <View className="size-9" />
                </View>
            )}

            {game.phase === "lobby" && (
                <OneWinnerWaitingRoomScreen
                    gameId={gameId}
                    game={game}
                    isHost={isHost}
                    canStart={canStart}
                    isStarting={isStarting}
                    onStart={start}
                    onSpawnGhosts={isHost ? spawnGhosts : undefined}
                />
            )}

            {game.phase === "intro" && <OneWinnerIntroStageScreen game={game} />}

            {game.phase === "melee" && <OneWinnerMeleeScreen game={game} myId={myId} onAnswer={answerMelee} />}
            {game.phase === "charge-theme" && <OneWinnerChargeThemeScreen game={game} myId={myId} onChooseTheme={chooseChargeTheme} />}
            {game.phase === "charge" && <OneWinnerChargeScreen game={game} myId={myId} onAnswer={answerCharge} />}
            {game.phase === "joute" && currentQuestionId && (
                <OneWinnerJouteScreen
                    game={game}
                    myId={myId}
                    onAnswer={(submittedText) => answerJoute({riddleId: currentQuestionId, submittedText})}
                    onFiletAnswer={(selectedIndex) => answerJoute({riddleId: currentQuestionId, selectedIndex})}
                />
            )}

            {game.phase === "classement" && <OneWinnerClassementScreen game={game} />}
            {game.phase === "elimination" && <OneWinnerEliminationScreen game={game} />}
            {game.phase === "termine" && <OneWinnerVictoryScreen game={game} myId={myId} />}
        </SafeAreaView>
    );
};

export default OneWinnerGameScreen;
