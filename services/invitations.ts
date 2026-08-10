export interface Invitation {
    code: string;
    matchId: string;
    creatorId: string;
    createdAt: number;
    usedByPlayerId: string | null;
}

export interface InvitationRepository {
    create(invitation: Invitation): Promise<void>;
    getByCode(code: string): Promise<Invitation | null>;
    markUsed(code: string, playerId: string): Promise<void>;
}

// Alphabet sans caractères ambigus (pas de 0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateInvitationCode(): string {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i += 1) {
        code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
}

export function buildInvitationLink(code: string): string {
    return `joute://match/${code}`;
}

export const PENDING_INVITE_STORAGE_KEY = "joute:pending-invite-code";
