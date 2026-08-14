import AsyncStorage from "@react-native-async-storage/async-storage";
import {generateId} from "@/lib/utils";

export interface ChatMessage {
    id: string;
    fromMe: boolean;
    text: string;
    createdAt: number;
    /** Invitation de duel intégrée au message, comme dans la charte v2 (bulle "Accepter"). */
    invite?: {category: string; points: number};
}

export interface Conversation {
    friendId: string;
    messages: ChatMessage[];
    unread: boolean;
}

type ConversationsState = Record<string, Conversation>;

const STORAGE_KEY = "joute:messages";

/** Amorce de conversation par défaut — ne sert que la toute première fois qu'un fil est ouvert (pas encore dans le storage). */
const SEED_CONVERSATIONS: Record<string, Omit<Conversation, "friendId">> = {
    "ghost-emma": {
        unread: true,
        messages: [
            {id: "seed-1", fromMe: false, text: "Salut ! Tu veux tenter un duel Histoire ce soir ?", createdAt: Date.now() - 3 * 3600_000, invite: {category: "Histoire", points: 9}},
        ],
    },
    "ghost-leo": {
        unread: true,
        messages: [
            {id: "seed-2", fromMe: false, text: "GG pour la partie d'hier, bien joué 👏", createdAt: Date.now() - 26 * 3600_000},
        ],
    },
    "ghost-mia": {
        unread: false,
        messages: [
            {id: "seed-3", fromMe: true, text: "On se refait un plateau ce week-end ?", createdAt: Date.now() - 2 * 24 * 3600_000},
            {id: "seed-4", fromMe: false, text: "Avec plaisir, dis-moi quand !", createdAt: Date.now() - 2 * 24 * 3600_000 + 60_000},
        ],
    },
};

const CANNED_REPLIES = [
    "Haha, on verra qui gagne 😏",
    "Ça marche, à tout de suite !",
    "Bien joué pour ta dernière série !",
    "Je suis chaud pour une revanche.",
];

async function readState(): Promise<ConversationsState> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConversationsState) : {};
}

async function writeState(state: ConversationsState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedFor(friendId: string): Conversation {
    const seed = SEED_CONVERSATIONS[friendId];
    return seed ? {friendId, ...seed} : {friendId, messages: [], unread: false};
}

export const localMessagesRepository = {
    async list(): Promise<Conversation[]> {
        const state = await readState();
        const friendIds = new Set([...Object.keys(SEED_CONVERSATIONS), ...Object.keys(state)]);
        return Array.from(friendIds).map((friendId) => state[friendId] ?? seedFor(friendId));
    },

    async get(friendId: string): Promise<Conversation> {
        const state = await readState();
        return state[friendId] ?? seedFor(friendId);
    },

    async markRead(friendId: string): Promise<void> {
        const state = await readState();
        const conversation = state[friendId] ?? seedFor(friendId);
        if (!conversation.unread) return;
        state[friendId] = {...conversation, unread: false};
        await writeState(state);
    },

    /** Ajoute mon message, puis une réponse canée après un court délai — pas de vrai backend de chat, voir AGENTS.md. */
    async send(friendId: string, text: string): Promise<Conversation> {
        const state = await readState();
        const conversation = state[friendId] ?? seedFor(friendId);
        const mine: ChatMessage = {id: generateId("msg"), fromMe: true, text, createdAt: Date.now()};
        const updated: Conversation = {...conversation, unread: false, messages: [...conversation.messages, mine]};
        state[friendId] = updated;
        await writeState(state);
        return updated;
    },

    async receiveCannedReply(friendId: string): Promise<Conversation> {
        const state = await readState();
        const conversation = state[friendId] ?? seedFor(friendId);
        const reply: ChatMessage = {
            id: generateId("msg"),
            fromMe: false,
            text: CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)],
            createdAt: Date.now(),
        };
        const updated: Conversation = {...conversation, messages: [...conversation.messages, reply]};
        state[friendId] = updated;
        await writeState(state);
        return updated;
    },

    async unreadCount(): Promise<number> {
        const conversations = await this.list();
        return conversations.filter((conversation) => conversation.unread).length;
    },
};
