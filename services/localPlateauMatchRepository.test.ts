import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {PlateauMatch, Player} from "@/game/types";
import {localPlateauMatchRepository} from "./localPlateauMatchRepository";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

function buildPlayer(id: string): Player {
    return {id, displayName: id, avatarUrl: null, isGhost: false};
}

function buildMatch(overrides: Partial<PlateauMatch> = {}): PlateauMatch {
    const now = Date.now();
    return {
        id: "plateau-1",
        status: "active",
        players: ["p1", "p2", "p3", "p4"].map(buildPlayer),
        rounds: [],
        createdAt: now,
        updatedAt: now,
        expiresAt: now + 1000,
        ...overrides,
    };
}

beforeEach(async () => {
    await AsyncStorage.clear();
});

describe("localPlateauMatchRepository", () => {
    it("retourne une liste vide quand rien n'a été sauvegardé", async () => {
        expect(await localPlateauMatchRepository.list()).toEqual([]);
    });

    it("retourne null pour une partie inconnue", async () => {
        expect(await localPlateauMatchRepository.get("inconnu")).toBeNull();
    });

    it("sauvegarde puis relit une partie à l'identique", async () => {
        const match = buildMatch();
        await localPlateauMatchRepository.save(match);

        expect(await localPlateauMatchRepository.get(match.id)).toEqual(match);
        expect(await localPlateauMatchRepository.list()).toEqual([match]);
    });

    it("met à jour une partie existante sans dupliquer l'entrée", async () => {
        const match = buildMatch();
        await localPlateauMatchRepository.save(match);

        const updated = {...match, updatedAt: match.updatedAt + 1};
        await localPlateauMatchRepository.save(updated);

        const all = await localPlateauMatchRepository.list();
        expect(all.length).toBe(1);
        expect(all[0]).toEqual(updated);
    });

    it("garde plusieurs parties distinctes", async () => {
        const matchA = buildMatch({id: "plateau-a"});
        const matchB = buildMatch({id: "plateau-b"});
        await localPlateauMatchRepository.save(matchA);
        await localPlateauMatchRepository.save(matchB);

        const all = await localPlateauMatchRepository.list();
        expect(all.map((match) => match.id).sort()).toEqual(["plateau-a", "plateau-b"]);
    });
});
