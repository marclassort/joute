export const colors = {
    background: "#fff9e3",
    foreground: "#081126",
    card: "#fff8e7",
    muted: "#f6eecf",
    mutedForeground: "rgba(0, 0, 0, 0.6)",
    primary: "#081126",
    accent: "#ea7a53",
    border: "rgba(0, 0, 0, 0.1)",
    success: "#16a34a",
    destructive: "#dc2626",
    subscription: "#8fd1bd",
} as const;

/** Charte v2 (project-update/) — voir global.css pour les classes NativeWind correspondantes. */
export const plateauColors = {
    ink: "#14121F",
    inkSurface: "#1E1B36",
    paper: "#F6F0E6",
    card: "#FFFDF8",
    coral: "#F4744C",
    teal: "#2FB8A8",
    iris: "#7C6BF5",
    brass: "#E7B24B",
    rose: "#E75A8E",
} as const;

export const radii = {
    pill: 12,
    card: 20,
    hero: 26,
    tabbar: 28,
    sheet: 30,
} as const;

export const spacing = {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    18: 72,
    20: 80,
    24: 96,
    30: 120,
} as const;

export const components = {
    tabBar: {
        height: 76,
        horizontalInset: 14,
        radius: radii.tabbar,
        iconFrame: spacing[12],
        itemPaddingVertical: spacing[2],
    },
} as const;

/** Marges de la charte v2 (project-update/) : 18px de bord d'écran, 14px de gap entre blocs.
 * Ne pas utiliser `spacing[18]` (72) ni `spacing[14]` (56) pour ces valeurs — indices distincts, collision de nom. */
export const layout = {
    screenEdge: 18,
    blockGap: 14,
} as const;

/** Cibles tactiles minimales de la charte v2. */
export const touchTarget = {
    cta: 56,
    tabItem: 62,
    answerTile: 60,
} as const;

export const theme = {
    colors,
    plateauColors,
    radii,
    spacing,
    components,
    layout,
    touchTarget,
} as const;