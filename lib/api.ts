const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export interface LeaderboardEntry {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    totalXp: number;
    rank: number;
}

export interface LeaderboardResponse {
    top: LeaderboardEntry[];
    me: LeaderboardEntry | null;
}

export interface SubmitScoreInput {
    totalXp: number;
    displayName: string;
    avatarUrl?: string | null;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    if (!API_BASE_URL) {
        throw new Error("EXPO_PUBLIC_API_BASE_URL n'est pas configuré");
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {"Content-Type": "application/json", ...options.headers},
    });
    if (!response.ok) {
        throw new Error(`Requête API échouée (${response.status})`);
    }
    return response.json() as Promise<T>;
}

/** Classement mondial (joute-api). token facultatif : sans lui, "me" est toujours null (l'API ne peut pas identifier l'appelant). */
export async function fetchLeaderboard(token?: string | null): Promise<LeaderboardResponse> {
    return apiFetch<LeaderboardResponse>("/api/leaderboard", {
        headers: token ? {Authorization: `Bearer ${token}`} : undefined,
    });
}

/** Pousse le total d'XP courant (calculé localement) vers le classement mondial — réservé aux joueurs connectés. */
export async function submitScore(token: string, input: SubmitScoreInput): Promise<void> {
    await apiFetch<{ok: true}>("/api/scores", {
        method: "POST",
        headers: {Authorization: `Bearer ${token}`},
        body: JSON.stringify(input),
    });
}
