import {Pressable, Text, View} from "react-native";
import React, {useEffect, useRef} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {useOneWinnerGame} from "../hooks/useOneWinnerGame";
import {useDevGhostAutoplay} from "../hooks/useDevGhostAutoplay";
import OneWinnerWaitingRoomScreen from "./OneWinnerWaitingRoomScreen";
import OneWinnerIntroStageScreen from "./OneWinnerIntroStageScreen";
import OneWinnerDefiScreen from "./OneWinnerDefiScreen";
import OneWinnerBuzzerScreen from "./OneWinnerBuzzerScreen";
import OneWinnerConqueteScreen from "./OneWinnerConqueteScreen";
import OneWinnerClassementScreen from "./OneWinnerClassementScreen";
import OneWinnerEliminationScreen from "./OneWinnerEliminationScreen";
import OneWinnerVictoryScreen from "./OneWinnerVictoryScreen";

const SafeAreaView = styled(RNSafeAreaView);

export interface OneWinnerGameScreenProps {
    gameId: string;
}

const INTRO_DELAY_MS = 2600;
const CLASSEMENT_DELAY_MS = 3200;
const ELIMINATION_DELAY_MS = 3200;
// Filet de sécurité si tous les joueurs actifs ne terminent jamais l'épreuve (déconnexion, blocage) :
// l'hôte force la fin plutôt que de bloquer la partie indéfiniment.
const EPREUVE_END_SAFETY_MS = 45_000;

const OneWinnerGameScreen = ({gameId}: OneWinnerGameScreenProps) => {
    const router = useRouter();
    const {game, isLoading, error, myId, isHost, canStart, isStarting, start, startNextEpreuve, endEpreuve, eliminate, advance, buzz, answer} =
        useOneWinnerGame(gameId);
    const {spawnGhosts} = useDevGhostAutoplay(gameId, game);

    const inFlightRef = useRef(false);

    // Hôte : fait avancer la partie automatiquement d'une phase à l'autre (intro -> épreuves -> classement -> élimination -> étape suivante).
    useEffect(() => {
        if (!isHost || !game || inFlightRef.current) return undefined;

        if (game.phase === "intro") {
            const timeout = setTimeout(() => {
                inFlightRef.current = true;
                startNextEpreuve().finally(() => {
                    inFlightRef.current = false;
                });
            }, INTRO_DELAY_MS);
            return () => clearTimeout(timeout);
        }

        if (game.phase === "epreuve" && !game.currentEpreuve) {
            inFlightRef.current = true;
            startNextEpreuve().finally(() => {
                inFlightRef.current = false;
            });
            return undefined;
        }

        if (game.phase === "classement") {
            const timeout = setTimeout(() => {
                inFlightRef.current = true;
                eliminate().finally(() => {
                    inFlightRef.current = false;
                });
            }, CLASSEMENT_DELAY_MS);
            return () => clearTimeout(timeout);
        }

        if (game.phase === "elimination") {
            const timeout = setTimeout(() => {
                inFlightRef.current = true;
                advance().finally(() => {
                    inFlightRef.current = false;
                });
            }, ELIMINATION_DELAY_MS);
            return () => clearTimeout(timeout);
        }

        return undefined;
    }, [isHost, game, startNextEpreuve, eliminate, advance]);

    // Hôte : termine l'épreuve dès que tous les joueurs actifs ont fini, sinon après le filet de sécurité.
    useEffect(() => {
        if (!isHost || !game || game.phase !== "epreuve" || !game.currentEpreuve) return undefined;

        const epreuve = game.currentEpreuve;
        const activePlayers = game.players.filter((player) => !player.isEliminated);
        const isComplete =
            epreuve.kind === "buzzer"
                ? epreuve.questionIds.every((id) => epreuve.answers.some((answerEntry) => answerEntry.questionId === id && answerEntry.isCorrect))
                : activePlayers.every(
                      (player) => epreuve.answers.filter((answerEntry) => answerEntry.playerId === player.id).length >= epreuve.questionIds.length,
                  );

        if (isComplete) {
            endEpreuve();
            return undefined;
        }

        const timeout = setTimeout(() => endEpreuve(), EPREUVE_END_SAFETY_MS);
        return () => clearTimeout(timeout);
    }, [isHost, game, endEpreuve]);

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
                    <Pressable className="duel-close-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                        <Text className="duel-close-icon">←</Text>
                    </Pressable>
                    <Text className="duel-header-title">Un seul gagnant</Text>
                    <View className="size-9" />
                </View>
                <Text className="home-empty-state mt-6 text-center text-plateau-paper/60">{error ?? "Partie introuvable."}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            {game.phase !== "termine" && (
                <View className="duel-header">
                    <Pressable className="duel-close-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
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

            {(game.phase === "intro" || (game.phase === "epreuve" && !game.currentEpreuve)) && <OneWinnerIntroStageScreen game={game} />}

            {game.phase === "epreuve" && game.currentEpreuve?.kind === "defi" && (
                <OneWinnerDefiScreen
                    game={game}
                    myId={myId}
                    onAnswer={(input) => {
                        answer(input).catch(() => {});
                    }}
                    onClose={() => router.back()}
                />
            )}
            {game.phase === "epreuve" && game.currentEpreuve?.kind === "buzzer" && (
                <OneWinnerBuzzerScreen game={game} myId={myId} onBuzz={buzz} onAnswer={answer} />
            )}
            {game.phase === "epreuve" && game.currentEpreuve?.kind === "conquete" && <OneWinnerConqueteScreen game={game} myId={myId} onAnswer={answer} />}

            {game.phase === "classement" && <OneWinnerClassementScreen game={game} />}
            {game.phase === "elimination" && <OneWinnerEliminationScreen game={game} />}
            {game.phase === "termine" && <OneWinnerVictoryScreen game={game} myId={myId} />}
        </SafeAreaView>
    );
};

export default OneWinnerGameScreen;
