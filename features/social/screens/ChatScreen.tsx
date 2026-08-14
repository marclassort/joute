import {KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View} from "react-native";
import React, {useCallback, useRef, useState} from "react";
// eslint-disable-next-line import/no-named-as-default
import clsx from "clsx";
import {styled} from "nativewind";
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {useFocusEffect} from "@react-navigation/native";
import {useRouter} from "expo-router";
import {createMatch} from "@/game/engine";
import {Player} from "@/game/types";
import {findFriend} from "@/game/social";
import {generateId} from "@/lib/utils";
import {goBackOrHome} from "@/lib/navigation";
import {useCurrentPlayer} from "@/features/joute/hooks/useCurrentPlayer";
import {useMatches} from "@/features/joute/hooks/useMatches";
import {ChatMessage, Conversation, localMessagesRepository} from "@/services/localMessagesRepository";

const SafeAreaView = styled(RNSafeAreaView);

export interface ChatScreenProps {
    friendId: string;
}

const ChatScreen = ({friendId}: ChatScreenProps) => {
    const router = useRouter();
    const friend = findFriend(friendId);
    const {id: myId, displayName, avatarUrl} = useCurrentPlayer();
    const {saveMatch} = useMatches();
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [draft, setDraft] = useState("");
    const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useFocusEffect(
        useCallback(() => {
            localMessagesRepository.get(friendId).then(setConversation);
            localMessagesRepository.markRead(friendId);
            return () => {
                if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
            };
        }, [friendId]),
    );

    const handleSend = async () => {
        const text = draft.trim();
        if (!text) return;
        setDraft("");
        const updated = await localMessagesRepository.send(friendId, text);
        setConversation(updated);
        replyTimeoutRef.current = setTimeout(async () => {
            const withReply = await localMessagesRepository.receiveCannedReply(friendId);
            setConversation(withReply);
        }, 1200);
    };

    const handleAcceptInvite = async () => {
        if (!myId || !friend) return;
        const me: Player = {id: myId, displayName, avatarUrl: avatarUrl ?? null, isGhost: false};
        const opponent: Player = {id: friend.id, displayName: friend.displayName, avatarUrl: null, isGhost: true};
        const match = createMatch({id: generateId("match"), players: [me, opponent]});
        await saveMatch(match);
        router.push(`/joute/${match.id}`);
    };

    if (!friend) return null;

    return (
        <SafeAreaView className="flex-1 bg-plateau-paper pt-[18px]">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
                <View className="chat-header px-[14px]">
                    <Pressable className="solo-back-button" onPress={() => goBackOrHome(router, "/messages")} accessibilityRole="button" accessibilityLabel="Retour">
                        <Text className="solo-back-icon">‹</Text>
                    </Pressable>
                    <View className="chat-header-avatar" style={{backgroundColor: `${friend.tint}29`}}>
                        <Text className="text-[19px]">{friend.glyph}</Text>
                    </View>
                    <View className="chat-header-copy">
                        <Text className="chat-header-name" numberOfLines={1}>
                            {friend.displayName}
                        </Text>
                        <Text className="chat-header-status">{friend.online ? "En ligne" : "Hors ligne"}</Text>
                    </View>
                    <Pressable className="chat-duel-button" onPress={handleAcceptInvite} accessibilityRole="button">
                        <Text className="chat-duel-text">⚔ Duel</Text>
                    </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-[9px] px-[14px] pb-4 pt-[14px]">
                    {conversation?.messages.map((message: ChatMessage) => (
                        <View key={message.id} className={clsx("flex-row", message.fromMe ? "justify-end" : "justify-start")}>
                            <View className={clsx("chat-bubble", message.fromMe ? "chat-bubble-mine" : "chat-bubble-theirs")}>
                                <Text className={message.fromMe ? "chat-bubble-text-mine" : "chat-bubble-text-theirs"}>{message.text}</Text>
                                {message.invite && (
                                    <View className="chat-invite-row">
                                        <View className="chat-invite-pill">
                                            <Text className="chat-invite-pill-text">
                                                {message.invite.category} · {message.invite.points} pts
                                            </Text>
                                        </View>
                                        <Pressable className="chat-invite-accept" onPress={handleAcceptInvite} accessibilityRole="button">
                                            <Text className="chat-invite-accept-text">Accepter</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))}
                </ScrollView>

                <View className="chat-input-row px-[14px] pb-2">
                    <TextInput
                        className="chat-input"
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="Écrire un message…"
                        autoCorrect={false}
                        onSubmitEditing={handleSend}
                        returnKeyType="send"
                    />
                    <Pressable className="chat-send-button" onPress={handleSend} accessibilityRole="button" accessibilityLabel="Envoyer">
                        <Text className="chat-send-icon">↑</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;
