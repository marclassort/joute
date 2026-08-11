import AsyncStorage from "@react-native-async-storage/async-storage";
import {Invitation, InvitationRepository} from "./invitations";

const STORAGE_KEY = "joute:invitations";

async function readAll(): Promise<Record<string, Invitation>> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Invitation>) : {};
}

async function writeAll(invitations: Record<string, Invitation>): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(invitations));
}

export const localInvitationRepository: InvitationRepository = {
    async create(invitation) {
        const invitations = await readAll();
        invitations[invitation.code] = invitation;
        await writeAll(invitations);
    },
    async getByCode(code) {
        const invitations = await readAll();
        return invitations[code] ?? null;
    },
    async markUsed(code, playerId) {
        const invitations = await readAll();
        const invitation = invitations[code];
        if (!invitation) return;
        invitations[code] = {...invitation, usedByPlayerId: playerId};
        await writeAll(invitations);
    },
};
