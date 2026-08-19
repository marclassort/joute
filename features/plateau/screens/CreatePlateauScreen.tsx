import {Pressable, Text, View} from "react-native";
import React, {useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {createPlateauMatch} from "@/game/plateauEngine";
import {PLATEAU_MAX_PLAYERS, PLATEAU_MIN_PLAYERS, PLATEAU_WINNING_SCORE, Player} from "@/game/types";
import ghosts from "@/data/ghosts";
import {generateId} from "@/lib/utils";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import PressableScale from "@/components/PressableScale";
import PrimaryButton from "@/components/PrimaryButton";
import {plateauColors} from "@/constants/theme";
import {usePlateauMatches} from "../hooks/usePlateauMatches";

const SafeAreaView = styled(RNSafeAreaView);

const PLAYER_COUNT_OPTIONS = Array.from(
    {length: PLATEAU_MAX_PLAYERS - PLATEAU_MIN_PLAYERS + 1},
    (_, i) => PLATEAU_MIN_PLAYERS + i,
);

function pickRandomGhosts(count: number): Player[] {
    const shuffled = [...ghosts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map((ghost) => ({id: ghost.id, displayName: ghost.displayName, avatarUrl: ghost.avatarUrl, isGhost: true}));
}

const CreatePlateauScreen = () => {
    const router = useRouter();
    const {id: myId, displayName, avatarUrl} = useCurrentPlayer();
    const {saveMatch} = usePlateauMatches();
    const [playerCount, setPlayerCount] = useState(PLATEAU_MIN_PLAYERS);

    const handleCreate = async () => {
        if (!myId) return;

        const me: Player = {id: myId, displayName, avatarUrl: avatarUrl ?? null, isGhost: false};
        const opponents = pickRandomGhosts(playerCount - 1);
        const match = createPlateauMatch({id: generateId("plateau"), players: [me, ...opponents]});
        await saveMatch(match);
        router.replace(`/plateau/${match.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <View className="duel-header">
                <Pressable className="duel-close-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <Text className="duel-header-title">Plateau</Text>
                <View className="size-9" />
            </View>

            <View className="mt-5">
                <Text className="solo-hero-title text-plateau-paper">Combien de{"\n"}joueurs ?</Text>
                <Text className="solo-hero-subtitle text-plateau-paper/60">
                    Course collective à {PLATEAU_WINNING_SCORE} points · les places libres sont remplies par des profils de démonstration
                </Text>

                <View className="mt-6 flex-row gap-3">
                    {PLAYER_COUNT_OPTIONS.map((count) => (
                        <PressableScale
                            key={count}
                            className={clsx("duel-category-card", "flex-1 justify-center", playerCount === count && "border-plateau-teal")}
                            style={{backgroundColor: playerCount === count ? plateauColors.teal : "rgba(255,253,248,0.06)"}}
                            onPress={() => setPlayerCount(count)}
                            accessibilityRole="button"
                            accessibilityState={{selected: playerCount === count}}
                        >
                            <Text className={clsx("duel-category-label text-center", playerCount === count ? "text-plateau-ink" : "text-plateau-paper")}>
                                {count}
                            </Text>
                        </PressableScale>
                    ))}
                </View>
            </View>

            <View className="mt-auto">
                <PrimaryButton title="Créer la partie" onPress={handleCreate} />
            </View>
        </SafeAreaView>
    );
};

export default CreatePlateauScreen;
