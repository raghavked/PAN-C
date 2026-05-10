// PAN!C — Stitch Design System Colors
export const colors = {
  // Primary Alert Red — the ONLY accent color
  alertRed: '#E24B4A',
  alertRedDark: '#C43B3A',
  alertRedLight: '#FF6B6A',

  // Backgrounds — tonal layering (no shadows, no gradients)
  base: '#000000',        // Level 0 — deepest background
  surface1: '#1A1A1A',   // Level 1 — cards/containers
  surface2: '#2C2C2C',   // Level 2 — modals/popovers

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',

  // Borders
  border: '#333333',
  borderActive: '#E24B4A',

  // Status
  success: '#639922',
  warning: '#BA7517',
  info: '#378ADD',
  danger: '#E24B4A',

  // Overlays
  overlay: 'rgba(0,0,0,0.7)',
  overlayRed: 'rgba(226,75,74,0.15)',

  // ── Legacy aliases for backward compatibility with old components ──
  primary: '#E24B4A',
  background: '#000000',
  surface: '#1A1A1A',
  onSurface: '#FFFFFF',
  onBackground: '#FFFFFF',
  onPrimary: '#FFFFFF',
  onSurfaceVariant: '#A0A0A0',
  border2: '#2C2C2C',
  surfaceLevel1: '#1A1A1A',
  surfaceLevel2: '#2C2C2C',
  surfaceContainerHigh: '#2C2C2C',
  errorContainer: 'rgba(226,75,74,0.2)',
  error: '#E24B4A',
  pending: '#BA7517',
} as const;

export type ColorKey = keyof typeof colors;
