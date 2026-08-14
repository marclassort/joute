import ghosts from "@/data/ghosts";
import {plateauColors} from "@/constants/theme";
import {GhostProfile} from "./types";

const GLYPHS = ["🦊", "🐼", "🦉", "🐨", "🦁", "🐯", "🐰", "🦝", "🐺", "🦔"];
const TINTS = [plateauColors.teal, plateauColors.iris, plateauColors.rose, plateauColors.brass, plateauColors.coral];

/** Petit hash déterministe pour dériver glyphe/couleur/présence d'un ami à partir de son id — stable d'un rendu à l'autre. */
function hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return hash;
}

export interface Friend extends GhostProfile {
    glyph: string;
    tint: string;
    online: boolean;
}

export const FRIENDS: Friend[] = ghosts.map((ghost) => {
    const hash = hashId(ghost.id);
    return {
        ...ghost,
        glyph: GLYPHS[hash % GLYPHS.length],
        tint: TINTS[hash % TINTS.length],
        online: hash % 3 !== 0,
    };
});

export function findFriend(id: string): Friend | undefined {
    return FRIENDS.find((friend) => friend.id === id);
}

export const LEVEL_LABELS: Record<GhostProfile["level"], string> = {
    "débutant": "Niveau débutant",
    "intermédiaire": "Niveau intermédiaire",
    "expert": "Niveau expert",
};
