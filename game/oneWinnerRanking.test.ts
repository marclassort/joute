import {computeRatingChanges, leagueRankForRating, ONE_WINNER_ELO_K, STARTING_RATING} from "./oneWinnerRanking";

describe("leagueRankForRating", () => {
    it("place aux bornes des paliers documentés", () => {
        expect(leagueRankForRating(0)).toEqual({tier: "initie", division: 3});
        expect(leagueRankForRating(999)).toEqual({tier: "initie", division: 1});
        expect(leagueRankForRating(1000)).toEqual({tier: "curieux", division: 3});
        expect(leagueRankForRating(1199)).toEqual({tier: "curieux", division: 1});
        expect(leagueRankForRating(1999)).toEqual({tier: "grand-maitre", division: 1});
        expect(leagueRankForRating(2000)).toEqual({tier: "legende", division: 1});
        expect(leagueRankForRating(5000)).toEqual({tier: "legende", division: 1});
    });

    it("les divisions montent avec le rating à l'intérieur d'un palier", () => {
        expect(leagueRankForRating(1000).division).toBe(3);
        expect(leagueRankForRating(1100).division).toBe(2);
        expect(leagueRankForRating(1199).division).toBe(1);
    });

    it("clampe les ratings négatifs à Initié division 3", () => {
        expect(leagueRankForRating(-500)).toEqual({tier: "initie", division: 3});
    });
});

describe("computeRatingChanges", () => {
    it("1 contre 1, ratings égaux : le vainqueur gagne exactement ce que le perdant perd", () => {
        const standings = [
            {playerId: "a", finalRank: 1},
            {playerId: "b", finalRank: 2},
        ];
        const [a, b] = computeRatingChanges(standings, {a: STARTING_RATING, b: STARTING_RATING});
        expect(a.delta).toBeGreaterThan(0);
        expect(b.delta).toBe(-a.delta);
        expect(a.delta).toBe(Math.round(ONE_WINNER_ELO_K * 0.5));
    });

    it("battre un adversaire mieux classé rapporte plus que battre un adversaire moins bien classé", () => {
        const strongWins = computeRatingChanges(
            [{playerId: "underdog", finalRank: 1}, {playerId: "favori", finalRank: 2}],
            {underdog: 900, favori: 1300},
        );
        const weakWins = computeRatingChanges(
            [{playerId: "favori", finalRank: 1}, {playerId: "underdog", finalRank: 2}],
            {underdog: 900, favori: 1300},
        );

        const underdogDeltaAsWinner = strongWins.find((c) => c.playerId === "underdog")!.delta;
        const favoriDeltaAsWinner = weakWins.find((c) => c.playerId === "favori")!.delta;
        expect(underdogDeltaAsWinner).toBeGreaterThan(favoriDeltaAsWinner);
    });

    it("à 4 joueurs de même rating, le delta est strictement décroissant du 1er au dernier", () => {
        const standings = [
            {playerId: "p1", finalRank: 1},
            {playerId: "p2", finalRank: 2},
            {playerId: "p3", finalRank: 3},
            {playerId: "p4", finalRank: 4},
        ];
        const ratings = Object.fromEntries(standings.map((s) => [s.playerId, STARTING_RATING]));
        const changes = computeRatingChanges(standings, ratings);

        const byRank = standings.map((s) => changes.find((c) => c.playerId === s.playerId)!.delta);
        expect(byRank[0]).toBeGreaterThan(byRank[1]);
        expect(byRank[1]).toBeGreaterThan(byRank[2]);
        expect(byRank[2]).toBeGreaterThan(byRank[3]);
    });

    it("la somme des deltas est nulle (à l'arrondi près) — à somme nulle sur toute la table", () => {
        const standings = [
            {playerId: "p1", finalRank: 1},
            {playerId: "p2", finalRank: 2},
            {playerId: "p3", finalRank: 3},
            {playerId: "p4", finalRank: 4},
            {playerId: "p5", finalRank: 5},
            {playerId: "p6", finalRank: 6},
        ];
        const ratings = {p1: 1450, p2: 980, p3: 1120, p4: 1600, p5: 1000, p6: 1310};
        const changes = computeRatingChanges(standings, ratings);
        const total = changes.reduce((sum, c) => sum + c.delta, 0);
        expect(Math.abs(total)).toBeLessThanOrEqual(changes.length);
    });

    it("un joueur sans historique démarre au Rating de départ", () => {
        const changes = computeRatingChanges(
            [{playerId: "nouveau", finalRank: 1}, {playerId: "b", finalRank: 2}],
            {b: STARTING_RATING},
        );
        expect(changes.find((c) => c.playerId === "nouveau")!.ratingBefore).toBe(STARTING_RATING);
    });

    it("le Rating ne descend jamais sous zéro", () => {
        const changes = computeRatingChanges(
            [{playerId: "a", finalRank: 1}, {playerId: "b", finalRank: 2}],
            {a: 2000, b: 10},
        );
        const b = changes.find((c) => c.playerId === "b")!;
        expect(b.ratingAfter).toBeGreaterThanOrEqual(0);
    });
});
