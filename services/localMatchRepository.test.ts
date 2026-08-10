import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Match, Player} from "@/game/types";
import {localMatchRepository} from "./localMatchRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

const playerOne: Player = {id: "p1", displayName: "Alix", avatarUrl: null, isGhost: false};
const playerTwo: Player = {id: "p2", displayName: "Bo", avatarUrl: null, isGhost: false};

function buildMatch(overrides: Partial<Match> = {}): Match {
    const now = Date.now();
    return {
        id: "match-1",
        status: "active",
        players: [playerOne, playerTwo],
        rounds: [],
        currentRoundIndex: 0,
        currentTurnPlayerId: playerOne.id,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 1000,
        invitationCode: null,
        ...overrides,
    };
}

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe("localMatchRepository", () => {
    it("retourne une liste vide quand rien n'a été sauvegardé", async () => {
        expect(await localMatchRepository.list()).toEqual([]);
    });

    it("retourne null pour une partie inconnue", async () => {
        expect(await localMatchRepository.get("inconnu")).toBeNull();
    });

    it("sauvegarde puis relit une partie à l'identique", async () => {
        const match = buildMatch();
        await localMatchRepository.save(match);

        expect(await localMatchRepository.get(match.id)).toEqual(match);
        expect(await localMatchRepository.list()).toEqual([match]);
    });

    it("met à jour une partie existante sans dupliquer l'entrée", async () => {
        const match = buildMatch();
        await localMatchRepository.save(match);

        const updated = {...match, currentTurnPlayerId: playerTwo.id};
        await localMatchRepository.save(updated);

        const all = await localMatchRepository.list();
        expect(all.length).toBe(1);
        expect(all[0]).toEqual(updated);
    });

    it("garde plusieurs parties distinctes", async () => {
        const matchA = buildMatch({id: "match-a"});
        const matchB = buildMatch({id: "match-b"});
        await localMatchRepository.save(matchA);
        await localMatchRepository.save(matchB);

        const all = await localMatchRepository.list();
        expect(all.map((match) => match.id).sort()).toEqual(["match-a", "match-b"]);
    });
});
