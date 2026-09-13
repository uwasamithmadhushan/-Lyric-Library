export { colors, darkColors, gradients } from './tokens';
export type { ColorKey } from './tokens';
export {
  APP_BACKGROUNDS,
  getAppBackground,
  resolveBackgroundSurfaces,
} from './backgrounds';
export type { AppBackgroundId, AppBackgroundPreset, BackgroundSurfaces } from './backgrounds';

export { spacing, radii } from './spacing';
export type { SpacingKey, RadiiKey } from './spacing';

export { fontFamily, fontWeight, fontSize, lineHeight, textVariants } from './typography';
export type { TextVariant } from './typography';

export { shadows } from './shadows';
export type { ShadowKey } from './shadows';

/** Re-export the full theme as a single object for convenience */
import { colors, gradients } from './tokens';
import { spacing, radii } from './spacing';
import { fontFamily, fontWeight, fontSize, lineHeight, textVariants } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  gradients,
  spacing,
  radii,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  textVariants,
  shadows,
} as const;

export type Theme = typeof theme;
