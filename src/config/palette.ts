export const palette = {
  primary: {
    100: "#E7F4F3",
    200: "#C2E6E3",
    300: "#99F6E4",
    400: "#5EEAD4",
    500: "#1F8D87",
  },
  primaryDark: {
    100: "#E7F4F3",
    200: "#CBD5E1",
    300: "#94A3B8",
    400: "#475569",
    500: "#0F5F5B",
  },
  accentTeal: {
    100: "#ECFDF5",
    200: "#CCFBF1",
    300: "#99F6E4",
    400: "#5EEAD4",
    500: "#14B8A6",
    600: "#1F8D87",
  },
  secondarySlate: {
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
  },
  destructiveRed: {
    100: "#FEF2F2",
    200: "#FEE2E2",
    300: "#FECACA",
    400: "#F87171",
    500: "#DC2626",
  },
  neutrals: {
    background: "#F8FAFC",
    surfaceCards: "#FFFFFF",
    border: "#E2E8F0",
    textPrimary: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#94A3B8",
    inputBorderDefault: "#F2F2F2",
    inputBorderSelected: "#E7ECFE",
    black: "#000000",
  },
} as const;

export type Palette = typeof palette;
