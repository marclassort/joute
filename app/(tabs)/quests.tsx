import {ScrollView, Text, View} from "react-native";
import React, {useMemo} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {computeQuestChain, nextQuestTier, QUEST_CHAIN_THRESHOLDS} from "@/game/quests";
import {DRAWABLE_CATEGORIES} from "@/game/rules";
import {masteryPercent} from "@/services/localSoloStatsRepository";
import {plateauColors} from "@/constants/theme";
import {useGamification} from "@/hooks/useGamification";
import {useQuestStats} from "@/hooks/useQuestStats";
import {useSoloStats} from "@/features/solo/hooks/useSoloStats";
import InkPattern from "@/components/InkPattern";
import ShadowCard from "@/components/ShadowCard";

const SafeAreaView = styled(RNSafeAreaView);
const STREAK_QUEST_TARGET = 7;
const MASTERY_QUEST_TARGET = 80;

const Quests = () => {
    const {fastAnswers} = useQuestStats();
    const {currentStreak} = useGamification();
    const {stats: soloStats} = useSoloStats();

    const chain = useMemo(() => computeQuestChain(fastAnswers), [fastAnswers]);
    const nextTier = nextQuestTier(fastAnswers);
    const chainMax = QUEST_CHAIN_THRESHOLDS[QUEST_CHAIN_THRESHOLDS.length - 1];

    const bestMastery = useMemo(
        () =>
            DRAWABLE_CATEGORIES.reduce((best, category) => {
                const percent = masteryPercent(soloStats[category]);
                return percent !== null && percent > best ? percent : best;
            }, 0),
        [soloStats],
    );

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper px-[18px] pt-[8px]">
            <View className="quest-title-row">
                <Text className="text-screen-title text-plateau-ink">Quêtes</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-[14px] pb-[110px] pt-[14px]">
                <View className="quest-chain-card">
                    <InkPattern />
                    <View className="quest-chain-header">
                        <Text className="text-eyebrow relative text-plateau-paper/60">Parcours de récompenses</Text>
                        <Text className="relative font-display text-[20px] tracking-[-0.02em] text-plateau-brass">{fastAnswers}</Text>
                    </View>
                    <View className="quest-chain-row">
                        {chain.map((tier, index) => (
                            <View key={tier.threshold} className="quest-chain-node">
                                <View
                                    className="quest-chain-line"
                                    style={{backgroundColor: index === 0 ? "transparent" : tier.isDone ? plateauColors.brass : "rgba(246,240,230,0.16)"}}
                                />
                                <View
                                    className="quest-chain-dot"
                                    style={{
                                        backgroundColor: tier.isDone ? plateauColors.brass : "rgba(246,240,230,0.08)",
                                        borderWidth: tier.isDone ? 0 : 1,
                                        borderStyle: tier.isDone ? "solid" : "dashed",
                                        borderColor: "rgba(246,240,230,0.3)",
                                    }}
                                >
                                    <Text className="text-base">{tier.isDone ? "✓" : "🔒"}</Text>
                                </View>
                                <Text className="quest-chain-label" style={{color: tier.isDone ? "rgba(246,240,230,0.9)" : "rgba(246,240,230,0.45)"}}>
                                    {tier.threshold}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <Text className="quest-chain-caption">
                        {nextTier
                            ? `Encore ${nextTier.threshold - fastAnswers} réponse(s) rapide(s) pour le prochain palier.`
                            : "Parcours complet — reviens vite pour la prochaine saison."}
                    </Text>
                </View>

                <Text className="text-eyebrow text-plateau-ink/45">Rapidité</Text>
                <ShadowCard borderRadius={22} className="hairline rounded-[22px] bg-plateau-card p-[14px] gap-[11px]">
                    <View className="quest-card-row">
                        <View className="quest-card-icon bg-plateau-coral/[0.16]">
                            <Text className="text-[18px]">⚡</Text>
                        </View>
                        <View className="quest-card-copy">
                            <Text className="quest-card-title">Éclair</Text>
                            <Text className="quest-card-desc">Réponds correctement en moins de 4 secondes.</Text>
                        </View>
                        {fastAnswers >= chainMax ? (
                            <Text className="quest-card-done-badge">Terminé</Text>
                        ) : (
                            <Text className="quest-card-reward">{fastAnswers}</Text>
                        )}
                    </View>
                    <View className="quest-card-progress-row">
                        <View className="quest-card-track">
                            <View
                                className="quest-card-fill"
                                style={{width: `${Math.min(100, (fastAnswers / chainMax) * 100)}%`, backgroundColor: plateauColors.coral}}
                            />
                        </View>
                        <Text className="quest-card-progress-text">{fastAnswers}/{chainMax}</Text>
                    </View>
                </ShadowCard>

                <Text className="text-eyebrow text-plateau-ink/45">Profil</Text>
                <View className="gap-[10px]">
                    <ShadowCard borderRadius={22} className="hairline rounded-[22px] bg-plateau-card p-[14px] gap-[11px]">
                        <View className="quest-card-row">
                            <View className="quest-card-icon bg-plateau-brass/[0.18]">
                                <Text className="text-[18px]">🔥</Text>
                            </View>
                            <View className="quest-card-copy">
                                <Text className="quest-card-title">Série quotidienne</Text>
                                <Text className="quest-card-desc">Joue chaque jour pour construire ta série.</Text>
                            </View>
                            {currentStreak >= STREAK_QUEST_TARGET ? (
                                <Text className="quest-card-done-badge">Terminé</Text>
                            ) : (
                                <Text className="quest-card-reward">{currentStreak} j</Text>
                            )}
                        </View>
                        <View className="quest-card-progress-row">
                            <View className="quest-card-track">
                                <View
                                    className="quest-card-fill"
                                    style={{
                                        width: `${Math.min(100, (currentStreak / STREAK_QUEST_TARGET) * 100)}%`,
                                        backgroundColor: plateauColors.brass,
                                    }}
                                />
                            </View>
                            <Text className="quest-card-progress-text">
                                {Math.min(currentStreak, STREAK_QUEST_TARGET)}/{STREAK_QUEST_TARGET}
                            </Text>
                        </View>
                    </ShadowCard>

                    <ShadowCard borderRadius={22} className="hairline rounded-[22px] bg-plateau-card p-[14px] gap-[11px]">
                        <View className="quest-card-row">
                            <View className="quest-card-icon bg-plateau-iris/[0.16]">
                                <Text className="text-[18px]">🎯</Text>
                            </View>
                            <View className="quest-card-copy">
                                <Text className="quest-card-title">Maîtriser un thème</Text>
                                <Text className="quest-card-desc">Atteins 80 % de bonnes réponses sur un thème en solo.</Text>
                            </View>
                            {bestMastery >= MASTERY_QUEST_TARGET ? (
                                <Text className="quest-card-done-badge">Terminé</Text>
                            ) : (
                                <Text className="quest-card-reward">{bestMastery}%</Text>
                            )}
                        </View>
                        <View className="quest-card-progress-row">
                            <View className="quest-card-track">
                                <View
                                    className="quest-card-fill"
                                    style={{
                                        width: `${Math.min(100, (bestMastery / MASTERY_QUEST_TARGET) * 100)}%`,
                                        backgroundColor: plateauColors.iris,
                                    }}
                                />
                            </View>
                            <Text className="quest-card-progress-text">
                                {Math.min(bestMastery, MASTERY_QUEST_TARGET)}/{MASTERY_QUEST_TARGET}
                            </Text>
                        </View>
                    </ShadowCard>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Quests;
