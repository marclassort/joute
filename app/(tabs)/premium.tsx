import {ScrollView, Text, View} from "react-native";
import React from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {plateauColors} from "@/constants/theme";
import {usePremium} from "@/hooks/usePremium";
import {PremiumPlan} from "@/lib/premium";
import InkPattern from "@/components/InkPattern";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

interface Perk {
    icon: string;
    tint: string;
    label: string;
    tag: string;
}

const PERKS: Perk[] = [
    {icon: "⚡", tint: plateauColors.coral, label: "Bonus quêtes ×2 : points de rapidité comptent double au classement", tag: "×2"},
    {icon: "👑", tint: plateauColors.brass, label: "Badge Premium affiché sur ton profil et le classement", tag: "Exclusif"},
    {icon: "🎭", tint: plateauColors.iris, label: "Avatars exclusifs réservés aux abonnés", tag: "Nouveau"},
    {icon: "🚀", tint: plateauColors.teal, label: "Accès en avant-première aux nouveaux modes de jeu", tag: "Early access"},
    {icon: "💛", tint: plateauColors.rose, label: "Un soutien direct pour continuer à faire grandir Joute", tag: "Merci"},
];

interface PlanOption {
    id: PremiumPlan;
    title: string;
    tag?: string;
    sub: string;
    price: string;
}

const PLANS: PlanOption[] = [
    {id: "annual", title: "Annuel", tag: "Économise 37 %", sub: "Soit 5,00 € / mois", price: "59,99 €"},
    {id: "monthly", title: "Mensuel", sub: "Sans engagement", price: "7,99 €"},
];

const Premium = () => {
    const {isPremium, plan, selectPlan, subscribe} = usePremium();

    const ctaLabel = isPremium ? "Abonnement actif ✓" : plan === "annual" ? "Essayer 7 jours gratuits" : "S'abonner · 7,99 € / mois";

    return (
        <SafeAreaView className="flex-1 bg-plateau-ink">
            <View className="relative flex-1 overflow-hidden">
                <InkPattern />
                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="relative gap-[14px] px-[18px] pb-[110px] pt-[14px]">
                    <View className="premium-header-row">
                        <View className="premium-header-badge">
                            <Text className="text-[21px] text-plateau-ink">👑</Text>
                        </View>
                        <View className="premium-header-copy">
                            <Text className="text-screen-title text-plateau-paper">Joute Premium</Text>
                            <Text className="text-[12.5px] text-plateau-paper/60">Essai 7 jours · sans engagement</Text>
                        </View>
                    </View>

                    <View className="premium-perks-card">
                        <Text className="text-eyebrow text-plateau-brass">Ce que ça change</Text>
                        {PERKS.map((perk) => (
                            <View key={perk.label} className="premium-perk-row">
                                <View className="premium-perk-icon" style={{backgroundColor: `${perk.tint}29`}}>
                                    <Text className="text-[13px]">{perk.icon}</Text>
                                </View>
                                <Text className="premium-perk-label">{perk.label}</Text>
                                <Text className="premium-perk-tag">{perk.tag}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="gap-[10px]">
                        {PLANS.map((option) => {
                            const selected = option.id === plan;
                            return (
                                <PressableScale
                                    key={option.id}
                                    className="premium-plan-row"
                                    onPress={() => selectPlan(option.id)}
                                    accessibilityRole="radio"
                                    accessibilityState={{selected}}
                                    style={{
                                        backgroundColor: selected ? `${plateauColors.coral}1F` : "rgba(246,240,230,0.06)",
                                        borderWidth: 1,
                                        borderColor: selected ? plateauColors.coral : "rgba(246,240,230,0.12)",
                                    }}
                                >
                                    <View className="premium-plan-radio" style={{borderColor: selected ? plateauColors.coral : "rgba(246,240,230,0.35)"}}>
                                        {selected && <View className="premium-plan-radio-dot" style={{backgroundColor: plateauColors.coral}} />}
                                    </View>
                                    <View className="premium-plan-copy">
                                        <View className="premium-plan-title-row">
                                            <Text className="premium-plan-title">{option.title}</Text>
                                            {option.tag && (
                                                <Text className="premium-plan-tag" style={{backgroundColor: plateauColors.teal, color: plateauColors.ink}}>
                                                    {option.tag}
                                                </Text>
                                            )}
                                        </View>
                                        <Text className="premium-plan-sub">{option.sub}</Text>
                                    </View>
                                    <Text className="premium-plan-price">{option.price}</Text>
                                </PressableScale>
                            );
                        })}
                    </View>

                    <View className="premium-bonus-banner">
                        <Text className="text-[20px]">⚡</Text>
                        <Text className="premium-bonus-text">
                            Bonus quêtes ×2 : tes points de rapidité comptent double au classement pendant l&#39;abonnement.
                        </Text>
                    </View>

                    <PressableScale
                        activeScale={0.98}
                        className="premium-cta-button"
                        style={isPremium ? {backgroundColor: plateauColors.teal} : undefined}
                        onPress={subscribe}
                        disabled={isPremium}
                        accessibilityRole="button"
                    >
                        <Text className="premium-cta-text">{ctaLabel}</Text>
                    </PressableScale>
                    <Text className="premium-legal-text">Rappel 24 h avant la fin de l&#39;essai · annulable en un tap · restaurer mes achats</Text>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default Premium;
