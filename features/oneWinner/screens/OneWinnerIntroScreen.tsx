import {Pressable, ScrollView, Text, View} from "react-native";
import React, {useState} from "react";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {useAuth} from "@clerk/expo";
import {createOneWinnerGame, OneWinnerAuth} from "@/lib/oneWinnerApi";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {goBackOrHome} from "@/lib/navigation";
import {plateauColors} from "@/constants/theme";
import PrimaryButton from "@/components/PrimaryButton";
import OneWinnerHatchBackground from "../components/OneWinnerHatchBackground";
import {ROUND_LABELS, ROUND_ORDER} from "../constants";

const SafeAreaView = styled(RNSafeAreaView);

const OneWinnerIntroScreen = () => {
    const router = useRouter();
    const {getToken} = useAuth();
    const player = useCurrentPlayer();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        setError(null);
        setIsCreating(true);
        try {
            let auth: OneWinnerAuth;
            if (player.isGuest) {
                if (!player.id) throw new Error("Identité invité non prête");
                auth = {kind: "guest", guestId: player.id, displayName: player.displayName};
            } else {
                const token = await getToken();
                if (!token) throw new Error("Non connecté");
                auth = {kind: "clerk", token};
            }
            const {id} = await createOneWinnerGame(auth);
            router.replace(`/one-winner/${id}`);
        } catch (caughtError) {
            setError((caughtError as Error).message);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink p-5">
            <OneWinnerHatchBackground />

            <View className="duel-header">
                <Pressable className="duel-close-button" onPress={() => goBackOrHome(router)} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="duel-close-icon">←</Text>
                </Pressable>
                <Text className="duel-header-title">Un seul gagnant</Text>
                <View className="size-9" />
            </View>

            <View className="mt-4 flex-row gap-[7px]">
                <View className="flex-1 items-center gap-1">
                    <View className="one-winner-player-avatar" style={{backgroundColor: plateauColors.coral}}>
                        <Text className="one-winner-player-avatar-text">{(player.displayName || "?").charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text className="text-[10.5px] font-sans-bold text-plateau-paper" numberOfLines={1}>
                        {player.displayName || "Toi"}
                    </Text>
                </View>
                {Array.from({length: 3}).map((_, index) => (
                    <View key={index} className="flex-1 items-center gap-1 opacity-40">
                        <View className="one-winner-slot-empty-avatar" />
                        <Text className="text-[10.5px] font-sans-medium text-plateau-paper/50">En attente</Text>
                    </View>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="mt-4 gap-4 pb-4">
                <View className="gap-2 rounded-[22px] border border-plateau-brass/40 bg-plateau-brass/[0.14] p-4">
                    <Text className="text-eyebrow text-plateau-brass">Table complète</Text>
                    <Text className="font-display text-[26px] leading-[1.12] tracking-[-0.03em]" style={{color: plateauColors.paper}}>
                        Trois manches,{"\n"}un seul gagnant
                    </Text>
                    <Text className="text-[13px] leading-[1.45] font-sans-medium" style={{color: "rgba(246,240,230,0.6)"}}>
                        À la fin de chaque manche, le dernier du classement cumulé quitte la table.
                    </Text>
                </View>

                {ROUND_ORDER.map((roundId) => {
                    const round = ROUND_LABELS[roundId];
                    const tint = plateauColors[round.tint];
                    return (
                        <View key={roundId} className="one-winner-rule-card">
                            <View className="one-winner-rule-card-header">
                                <View className="one-winner-rule-step" style={{backgroundColor: tint}}>
                                    <Text className="one-winner-rule-step-text">{round.step}</Text>
                                </View>
                                <View className="min-w-0 flex-1">
                                    <Text className="one-winner-rule-title">{round.title}</Text>
                                    <Text className="one-winner-rule-sub">{round.sub}</Text>
                                </View>
                                <View className="one-winner-rule-players-pill">
                                    <Text className="one-winner-rule-players-text">{round.players}</Text>
                                </View>
                            </View>
                            <View className="flex-row flex-wrap gap-[6px]">
                                {round.chips.map((chip) => (
                                    <View key={chip} className="one-winner-rule-chip">
                                        <Text className="one-winner-rule-chip-text">{chip}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View className="mt-auto gap-3 pt-3">
                {error && <Text className="session-error text-center">{error}</Text>}
                <PrimaryButton
                    title={isCreating ? "Création…" : "Créer une partie"}
                    onPress={handleCreate}
                    disabled={isCreating || !player.isReady}
                />
            </View>
        </SafeAreaView>
    );
};

export default OneWinnerIntroScreen;
