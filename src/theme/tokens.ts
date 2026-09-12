/**
 * Lyric Library — Design Tokens
 *
 * IMPORTANT: All color, spacing, and visual values MUST come from this file.
 * Never hardcode hex values, pixel sizes, or font configs in screen/component code.
 *
 * These tokens are derived directly from the approved wireframe:
 * /lyrics-library-wireframes.html
 */

export const colors = {
  // Brand (professional blue palette)
  primary: '#2563EB', // blue-600
  primaryDark: '#1E40AF',
  secondary: '#0EA5A4', // teal-ish
  accent: '#F59E0B', // amber accent

  // Backgrounds
  bgPrimary: '#FBFDFF',
  bgSecondary: '#F3F7FB',
  bgElevated: '#FFFFFF',

  // Text
  textPrimary: '#0F172A', // slate-900
  textSecondary: '#475569', // slate-600
  textTertiary: '#94A3B8', // slate-400

  // Borders
  border: '#E6EEF9',

  // Semantic
  error: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',

  // Overlays
  overlayLight: 'rgba(15, 23, 42, 0.04)',
  overlayMedium: 'rgba(15, 23, 42, 0.08)',

  // Active states
  primaryLight: 'rgba(37, 99, 235, 0.08)',
  secondaryLight: 'rgba(14, 165, 164, 0.08)',

  // Pure
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Dark palette used when the user selects dark mode. */
export const darkColors = {
  primary: '#60A5FA',
  primaryDark: '#2563EB',
  secondary: '#2DD4BF',
  accent: '#FBBF24',

  bgPrimary: '#0B1220',
  bgSecondary: '#111827',
  bgElevated: '#172033',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',

  border: '#243244',

  error: '#F87171',
  success: '#4ADE80',
  warning: '#FBBF24',

  overlayLight: 'rgba(248, 250, 252, 0.06)',
  overlayMedium: 'rgba(248, 250, 252, 0.12)',

  primaryLight: 'rgba(96, 165, 250, 0.16)',
  secondaryLight: 'rgba(45, 212, 191, 0.16)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/** Gradient stop arrays for use with LinearGradient */
export const gradients = {
  /** Primary brand gradient: blue → navy */
  gradient1: {
    colors: ['#2563EB', '#1E40AF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  /** Accent gradient: teal → blue */
  gradient2: {
    colors: ['#06B6D4', '#2563EB'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
} as const;

export type ColorKey = keyof typeof colors;
