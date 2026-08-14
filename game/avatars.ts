import {plateauColors} from "@/constants/theme";

export interface AvatarOption {
    id: string;
    glyph: string;
    bg: string;
}

/** Grille d'avatars de l'inscription — mêmes glyphes que les fantômes (data/ghosts.ts) pour rester cohérent
 * visuellement avec le reste de l'app, appliqués ici aux joueurs réels plutôt qu'aux adversaires. */
export const AVATAR_OPTIONS: AvatarOption[] = [
    {id: "renard", glyph: "🦊", bg: plateauColors.teal},
    {id: "panda", glyph: "🐼", bg: plateauColors.iris},
    {id: "hibou", glyph: "🦉", bg: plateauColors.brass},
    {id: "koala", glyph: "🐨", bg: plateauColors.rose},
    {id: "loutre", glyph: "🦦", bg: plateauColors.coral},
    {id: "lynx", glyph: "🐯", bg: plateauColors.teal},
    {id: "lapin", glyph: "🐰", bg: plateauColors.iris},
    {id: "raton", glyph: "🦝", bg: plateauColors.brass},
    {id: "loup", glyph: "🐺", bg: plateauColors.rose},
    {id: "herisson", glyph: "🦔", bg: plateauColors.coral},
    {id: "chouette", glyph: "🦄", bg: plateauColors.teal},
    {id: "dragon", glyph: "🐲", bg: plateauColors.iris},
];

export function findAvatarOption(id: string | undefined): AvatarOption {
    return AVATAR_OPTIONS.find((option) => option.id === id) ?? AVATAR_OPTIONS[0];
}
