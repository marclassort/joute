import {Image, Pressable, Text, View} from "react-native";
import React from "react";
import {useRouter} from "expo-router";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {useGamification} from "@/hooks/useGamification";
import {computeLevel} from "@/game/gamification";
import {plateauColors} from "@/constants/theme";
import {useUnreadMessages} from "@/hooks/useUnreadMessages";

export interface ProfileSheetProps {
    visible: boolean;
    onClose: () => void;
}

interface SheetItem {
    icon: string;
    tint: string;
    label: string;
    sub: string;
    badge: number | null;
    onPress: () => void;
}

/** Bottom sheet v2 (project-update/) ouvert par l'onglet Profil : accès rapide à Profil, Messages, Amis, Paramètres. */
const ProfileSheet = ({visible, onClose}: ProfileSheetProps) => {
    const router = useRouter();
    const {displayName, avatarUrl} = useCurrentPlayer();
    const {totalXp} = useGamification();
    const unreadMessages = useUnreadMessages();
    const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "?";
    const level = computeLevel(totalXp);

    if (!visible) return null;

    const go = (href: Parameters<typeof router.push>[0]) => () => {
        onClose();
        router.push(href);
    };

    const items: SheetItem[] = [
        {icon: "🦉", tint: plateauColors.teal, label: "Profil", sub: "Niveau, stats, badges", badge: null, onPress: go("/profile-modal")},
        {icon: "✉️", tint: plateauColors.coral, label: "Messages", sub: "Discussions avec tes amis", badge: unreadMessages || null, onPress: go("/messages")},
        {icon: "👥", tint: plateauColors.iris, label: "Amis", sub: "Défie tes amis en duel", badge: null, onPress: go("/friends")},
        {icon: "⚙️", tint: "rgba(20,18,31,0.5)", label: "Paramètres", sub: "Langue, sons, notifications", badge: null, onPress: go("/settings")},
    ];

    return (
        <>
            <Pressable className="profile-sheet-backdrop" onPress={onClose} accessibilityRole="button" accessibilityLabel="Fermer" />
            <View className="profile-sheet">
                <View className="profile-sheet-grabber" />

                <View className="profile-sheet-user-row">
                    {avatarUrl ? (
                        <Image source={{uri: avatarUrl}} className="profile-sheet-avatar" />
                    ) : (
                        <View className="profile-sheet-avatar" style={{backgroundColor: plateauColors.teal}}>
                            <Text className="profile-sheet-avatar-text">{avatarInitial}</Text>
                        </View>
                    )}
                    <View className="profile-sheet-user-copy">
                        <Text className="profile-sheet-name" numberOfLines={1}>
                            {displayName}
                        </Text>
                        <Text className="profile-sheet-meta">
                            Niv. {level} · {totalXp} pts
                        </Text>
                    </View>
                </View>

                {items.map((item) => (
                    <Pressable key={item.label} className="profile-sheet-item" onPress={item.onPress} accessibilityRole="button">
                        <View className="profile-sheet-item-icon" style={{backgroundColor: `${item.tint}29`}}>
                            <Text className="text-[19px]">{item.icon}</Text>
                        </View>
                        <View className="profile-sheet-item-copy">
                            <Text className="profile-sheet-item-label">{item.label}</Text>
                            <Text className="profile-sheet-item-sub">{item.sub}</Text>
                        </View>
                        {item.badge !== null && (
                            <View className="profile-sheet-item-badge">
                                <Text className="profile-sheet-item-badge-text">{item.badge}</Text>
                            </View>
                        )}
                        <Text className="profile-sheet-item-chevron">›</Text>
                    </Pressable>
                ))}

                <Pressable className="profile-sheet-close" onPress={onClose} accessibilityRole="button">
                    <Text className="profile-sheet-close-text">Fermer</Text>
                </Pressable>
            </View>
        </>
    );
};

export default ProfileSheet;
