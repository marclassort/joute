import {Pressable, ScrollView, Text, View} from "react-native";
import React, {useMemo, useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {useRouter} from "expo-router";
import {Category} from "@/game/types";
import {DRAWABLE_CATEGORIES} from "@/game/rules";
import {CATEGORY_LABELS} from "@/features/joute/constants";
import {masteryPercent, needsWork} from "@/services/localSoloStatsRepository";
import HardShadowCard from "@/features/joute/components/HardShadowCard";
import {SOLO_QUESTIONS_PER_SESSION} from "../constants";
import {useSoloStats} from "../hooks/useSoloStats";
import ThemeFilterChip from "../components/ThemeFilterChip";
import ThemeCard from "../components/ThemeCard";

const SafeAreaView = styled(RNSafeAreaView);

type Filter = "tous" | "a-travailler";

const ThemePickerScreen = () => {
    const router = useRouter();
    const {stats} = useSoloStats();
    const [filter, setFilter] = useState<Filter>("tous");
    const [selected, setSelected] = useState<Category | null>(null);

    const categories = useMemo(() => {
        if (filter === "tous") return DRAWABLE_CATEGORIES;
        return DRAWABLE_CATEGORIES.filter((category) => needsWork(stats[category]));
    }, [filter, stats]);

    const handleLaunch = () => {
        if (!selected) return;
        router.push(`/solo/${selected}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-cream p-5">
            <View className="solo-header">
                <Pressable className="solo-back-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="solo-back-icon">←</Text>
                </Pressable>
                <Text className="solo-header-title">Partie solo</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-4">
                <Text className="solo-hero-title mt-4">Ton terrain de{"\n"}chasse, champion ?</Text>
                <Text className="solo-hero-subtitle">
                    {SOLO_QUESTIONS_PER_SESSION} questions · 15 s par question · 1 point par bonne réponse
                </Text>

                <View className="solo-filters-row">
                    <ThemeFilterChip
                        label="Tous"
                        active={filter === "tous"}
                        onPress={() => {
                            setFilter("tous");
                            setSelected(null);
                        }}
                    />
                    <ThemeFilterChip
                        label="À travailler"
                        active={filter === "a-travailler"}
                        onPress={() => {
                            setFilter("a-travailler");
                            setSelected(null);
                        }}
                    />
                </View>

                <View className="solo-grid">
                    {categories.map((category) => (
                        <ThemeCard
                            key={category}
                            category={category}
                            masteryPercent={masteryPercent(stats[category])}
                            selected={selected === category}
                            onPress={() => setSelected(category)}
                        />
                    ))}
                </View>
            </ScrollView>

            <View className={clsx("solo-footer", !selected && "solo-cta-button-disabled")}>
                <HardShadowCard borderRadius={20} offsetY={5} className="solo-cta-button">
                    <Pressable
                        onPress={handleLaunch}
                        disabled={!selected}
                        accessibilityRole="button"
                        accessibilityLabel={selected ? `Lancer la partie solo · ${CATEGORY_LABELS[selected]}` : "Choisis un thème"}
                    >
                        <Text className="solo-cta-text">{selected ? `Lancer · ${CATEGORY_LABELS[selected]}` : "Choisis un thème"}</Text>
                    </Pressable>
                </HardShadowCard>
            </View>
        </SafeAreaView>
    );
};

export default ThemePickerScreen;
