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

/** Charte "plateau" (hub des modes et nouveaux écrans) — voir global.css pour les classes NativeWind correspondantes. */
export const plateauColors = {
    ink: "#0B1026",
    inkSurface: "#141B3D",
    cream: "#FFF6E2",
    orange: "#FF6A3D",
    violet: "#6C4DF6",
    lime: "#C9F24D",
    cyan: "#35D6E7",
    gold: "#FFC93C",
    pink: "#FF4D8D",
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
        height: spacing[18],
        horizontalInset: spacing[5],
        radius: spacing[8],
        iconFrame: spacing[12],
        itemPaddingVertical: spacing[2],
    },
} as const;

export const theme = {
    colors,
    plateauColors,
    spacing,
    components,
} as const;