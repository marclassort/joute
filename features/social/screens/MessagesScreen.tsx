import {Pressable, ScrollView, Text, View} from "react-native";
import React, {useCallback, useState} from "react";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useFocusEffect} from "@react-navigation/native";
import {useRouter} from "expo-router";
import {formatRelativeTime} from "@/lib/utils";
import {findFriend} from "@/game/social";
import {Conversation, localMessagesRepository} from "@/services/localMessagesRepository";
import PressableScale from "@/components/PressableScale";

const SafeAreaView = styled(RNSafeAreaView);

const MessagesScreen = () => {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);

    useFocusEffect(
        useCallback(() => {
            localMessagesRepository.list().then((list) =>
                setConversations([...list].sort((a, b) => (b.messages.at(-1)?.createdAt ?? 0) - (a.messages.at(-1)?.createdAt ?? 0))),
            );
        }, []),
    );

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[18px]">
            <View className="social-header px-[18px]">
                <Pressable className="solo-back-button" onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
                    <Text className="solo-back-icon">‹</Text>
                </Pressable>
                <Text className="social-header-title">Messages</Text>
                <Pressable className="social-header-link" onPress={() => router.push("/friends")} accessibilityRole="button">
                    <Text className="social-header-link-text">Amis</Text>
                </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-[9px] px-[18px] pb-[24px] pt-[14px]">
                {conversations.length === 0 ? (
                    <Text className="home-empty-state">Pas encore de conversation.</Text>
                ) : (
                    conversations.map((conversation) => {
                        const friend = findFriend(conversation.friendId);
                        if (!friend) return null;
                        const lastMessage = conversation.messages.at(-1);
                        return (
                            <PressableScale
                                key={conversation.friendId}
                                className="conversation-row"
                                onPress={() => router.push(`/messages/${conversation.friendId}`)}
                                accessibilityRole="button"
                            >
                                <View className="conversation-avatar" style={{backgroundColor: `${friend.tint}29`}}>
                                    <Text className="conversation-avatar-text">{friend.glyph}</Text>
                                </View>
                                <View className="conversation-copy">
                                    <View className="conversation-name-row">
                                        <Text className="conversation-name" numberOfLines={1}>
                                            {friend.displayName}
                                        </Text>
                                        {lastMessage && <Text className="conversation-time">{formatRelativeTime(lastMessage.createdAt)}</Text>}
                                    </View>
                                    <Text className="conversation-preview" numberOfLines={1}>
                                        {lastMessage?.fromMe ? "Toi : " : ""}
                                        {lastMessage?.text ?? "…"}
                                    </Text>
                                </View>
                                {conversation.unread && <View className="conversation-unread-dot" />}
                            </PressableScale>
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default MessagesScreen;
