/**
 * App background presets — each defines light + dark surface colors
 * so the chosen look adapts when Dark Mode is on.
 */

import type { AppBackgroundId } from '@/types';

export type { AppBackgroundId };

export type BackgroundSurfaces = {
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;
  border: string;
  /** Swatch shown in Settings picker */
  swatch: string;
};

export type AppBackgroundPreset = {
  id: AppBackgroundId;
  label: string;
  description: string;
  light: BackgroundSurfaces;
  dark: BackgroundSurfaces;
};

export const APP_BACKGROUNDS: AppBackgroundPreset[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Clean library look',
    light: {
      bgPrimary: '#FBFDFF',
      bgSecondary: '#F3F7FB',
      bgElevated: '#FFFFFF',
      border: '#E6EEF9',
      swatch: '#E8EEF6',
    },
    dark: {
      bgPrimary: '#0B1220',
      bgSecondary: '#111827',
      bgElevated: '#172033',
      border: '#243244',
      swatch: '#1E293B',
    },
  },
  {
    id: 'mist',
    label: 'Soft Mist',
    description: 'Cool airy wash',
    light: {
      bgPrimary: '#F4F7FA',
      bgSecondary: '#E4ECF4',
      bgElevated: '#FFFFFF',
      border: '#D0DBE8',
      swatch: '#C5D4E3',
    },
    dark: {
      bgPrimary: '#0A1018',
      bgSecondary: '#121A24',
      bgElevated: '#182231',
      border: '#2A384A',
      swatch: '#243041',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Teal-tinted calm',
    light: {
      bgPrimary: '#F2FAF9',
      bgSecondary: '#DCEFEE',
      bgElevated: '#FFFFFF',
      border: '#C5DFDC',
      swatch: '#7DBDB8',
    },
    dark: {
      bgPrimary: '#071412',
      bgSecondary: '#0F1F1D',
      bgElevated: '#152926',
      border: '#1F3A36',
      swatch: '#1A3A36',
    },
  },
  {
    id: 'sand',
    label: 'Warm Sand',
    description: 'Soft warm reading',
    light: {
      bgPrimary: '#FBF7F2',
      bgSecondary: '#F0E6D8',
      bgElevated: '#FFFCF8',
      border: '#E6D8C6',
      swatch: '#D9C4A8',
    },
    dark: {
      bgPrimary: '#14100C',
      bgSecondary: '#1C1712',
      bgElevated: '#261F18',
      border: '#3A3026',
      swatch: '#3A3026',
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Quiet green tone',
    light: {
      bgPrimary: '#F4F8F4',
      bgSecondary: '#DEE9DF',
      bgElevated: '#FFFFFF',
      border: '#C9D8CB',
      swatch: '#8FA891',
    },
    dark: {
      bgPrimary: '#0A120C',
      bgSecondary: '#121C14',
      bgElevated: '#182418',
      border: '#2A3A2C',
      swatch: '#243528',
    },
  },
  {
    id: 'slate',
    label: 'Slate',
    description: 'Neutral studio grey',
    light: {
      bgPrimary: '#F6F7F9',
      bgSecondary: '#E5E8ED',
      bgElevated: '#FFFFFF',
      border: '#D3D8E0',
      swatch: '#A8B0BC',
    },
    dark: {
      bgPrimary: '#0C0E12',
      bgSecondary: '#151821',
      bgElevated: '#1C202B',
      border: '#2E3542',
      swatch: '#2A303C',
    },
  },
];

export function getAppBackground(id: AppBackgroundId): AppBackgroundPreset {
  if (id === 'custom') return APP_BACKGROUNDS[0];
  return APP_BACKGROUNDS.find((item) => item.id === id) ?? APP_BACKGROUNDS[0];
}

export function resolveBackgroundSurfaces(
  id: AppBackgroundId,
  isDark: boolean,
): BackgroundSurfaces {
  const preset = getAppBackground(id);
  return isDark ? preset.dark : preset.light;
}
