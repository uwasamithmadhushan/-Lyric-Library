/**
 * Spacing scale — based on 4px base unit.
 * Use these instead of raw numbers in all layout code.
 */
export const spacing = {
  /** 2px — micro spacing */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 6px */
  s: 6,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  xxl: 24,
  /** 32px */
  xxxl: 32,
  /** 40px */
  huge: 40,
  /** 48px */
  massive: 48,
  /** 56px — status bar offset */
  statusBarOffset: 56,
} as const;

/** Border radius presets from wireframe */
export const radii = {
  /** 8px — small elements (alphabet buttons, bookmark icons) */
  sm: 8,
  /** 10px — nav icons */
  md: 10,
  /** 12px — song rows, result items */
  lg: 12,
  /** 16px — cards, search bars, collection items */
  xl: 16,
  /** 20px — filter chips/pills */
  pill: 20,
  /** 36px — phone screen inner radius */
  screen: 36,
  /** 9999px — full circle (avatars) */
  full: 9999,
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiiKey = keyof typeof radii;
