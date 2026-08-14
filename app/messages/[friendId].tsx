import React from "react";
import {Redirect, useLocalSearchParams} from "expo-router";
import {findFriend} from "@/game/social";
import ChatScreen from "@/features/social/screens/ChatScreen";

export default function Chat() {
    const {friendId} = useLocalSearchParams<{friendId: string}>();

    if (!findFriend(friendId)) return <Redirect href="/messages" />;

    return <ChatScreen friendId={friendId} />;
}
