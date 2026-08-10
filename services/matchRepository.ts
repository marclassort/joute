import {Match} from "@/game/types";

export interface MatchRepository {
    list(): Promise<Match[]>;
    get(matchId: string): Promise<Match | null>;
    save(match: Match): Promise<void>;
}
