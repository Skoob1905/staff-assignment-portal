/**
 * Single source of truth for the brand colours.
 *
 * Change `primary` here to re-skin the app: `applyTheme()` pushes these values
 * into CSS variables (`--primary`, `--primary-hover`, `--primary-100`, ...),
 * so every `var(--primary*)` class and component follows automatically.
 */
export const colors = {
  primary: "#1f8d87",
  primaryForeground: "#ffffff",
  primaryHover: "#1a7a75",
  primarySoft: "#e7f4f3",
  primaryWash: "#f1faf9",
  primaryTint: "rgba(31, 141, 135, 0.10)",
  primaryBorder: "rgba(31, 141, 135, 0.20)",
  primaryShadow: "rgba(31, 141, 135, 0.25)",
  primaryGradient: "#1f8d87",
  accent: "#99f6e4",
  accentMid: "#5eead4",
  accentTranslucent: "rgba(153, 246, 228, 0.45)",
} as const;

export type Colors = typeof colors;
