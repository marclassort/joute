import {useCallback, useState} from "react";
import {useFocusEffect} from "@react-navigation/native";
import {localMessagesRepository} from "@/services/localMessagesRepository";

/** Nombre de conversations non lues, rechargé à chaque reprise de focus (ex. après lecture d'un message). */
export function useUnreadMessages() {
    const [count, setCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            localMessagesRepository.unreadCount().then(setCount);
        }, []),
    );

    return count;
}
