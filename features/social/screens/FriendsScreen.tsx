import {Pressable, ScrollView, Text, View} from "react-native";
import React from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useRouter} from "expo-router";
import {createMatch} from "@/game/engine";
import {Player} from "@/game/types";
import {FRIENDS, LEVEL_LABELS} from "@/game/social";
import {generateId} from "@/lib/utils";
import {goBackOrHome} from "@/lib/navigation";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {useMatches} from "@/features/joute/hooks/useMatches";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

const FriendsScreen = () => {
    const router = useRouter();
    const {id: myId, displayName, avatarUrl} = useCurrentPlayer();
    const {saveMatch} = useMatches();

    const handleChallenge = async (friendId: string, friendName: string) => {
        if (!myId) return;
        const me: Player = {id: myId, displayName, avatarUrl: avatarUrl ?? null, isGhost: false};
        const opponent: Player = {id: friendId, displayName: friendName, avatarUrl: null, isGhost: true};
        const match = createMatch({id: generateId("match"), players: [me, opponent]});
        await saveMatch(match);
        router.push(`/joute/${match.id}`);
    };

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[18px]">
            <View className="social-header px-[18px]">
                <Pressable className="solo-back-button" onPress={() => goBackOrHome(router)} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="solo-back-icon">‹</Text>
                </Pressable>
                <Text className="social-header-title">Amis</Text>
                <Pressable className="social-header-link" onPress={() => router.push("/messages")} accessibilityRole="button">
                    <Text className="social-header-link-text">Messages</Text>
                </Pressable>
            </View>

            <View className="mt-[14px] px-[18px]">
                <View className="friend-search-bar">
                    <Text className="text-[14px] opacity-50">⌕</Text>
                    <Text className="friend-search-placeholder">Chercher un pseudo</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-[9px] px-[18px] pb-[24px] pt-[14px]">
                {FRIENDS.map((friend) => (
                    <View key={friend.id} className="friend-row">
                        <View className="friend-avatar" style={{backgroundColor: `${friend.tint}29`}}>
                            <Text className="friend-avatar-text">{friend.glyph}</Text>
                            {friend.online && <View className="friend-online-dot" />}
                        </View>
                        <View className="friend-copy">
                            <Text className="friend-name" numberOfLines={1}>
                                {friend.displayName}
                            </Text>
                            <Text className="friend-meta">{LEVEL_LABELS[friend.level]}</Text>
                        </View>
                        <Pressable
                            className="friend-message-button"
                            onPress={() => router.push(`/messages/${friend.id}`)}
                            accessibilityRole="button"
                            accessibilityLabel={`Écrire à ${friend.displayName}`}
                        >
                            <Text className="friend-message-icon">✉</Text>
                        </Pressable>
                        <PressableScale
                            className="friend-challenge-button"
                            onPress={() => handleChallenge(friend.id, friend.displayName)}
                            accessibilityRole="button"
                        >
                            <Text className="friend-challenge-text">Défier</Text>
                        </PressableScale>
                    </View>
                ))}

                <View className="friend-invite-card">
                    <View className="friend-invite-icon">
                        <Text className="text-[17px]">＋</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="friend-invite-title">Inviter des amis</Text>
                        <Text className="friend-invite-subtitle">+80 pts par ami qui joue une manche</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default FriendsScreen;
