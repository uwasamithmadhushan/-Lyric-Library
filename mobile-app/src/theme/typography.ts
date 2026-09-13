import { Platform, TextStyle } from 'react-native';

/**
 * Typography system — mirrors wireframe font hierarchy.
 *
 * Wireframe uses:
 *   Headings: Playfair Display (serif)
 *   Body: Manrope (sans-serif)
 *
 * On RN we map to:
 *   Heading: system serif or loaded custom font
 *   Body: system sans-serif or loaded custom font
 */

/** Font families */
export const fontFamily = {
  heading: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
} as const;

/** Font weights (mapped to RN string literals) */
export const fontWeight = {
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extrabold: '800' as TextStyle['fontWeight'],
};

/** Font sizes — pixel values matching wireframe rem→px conversion */
export const fontSize = {
  /** 10px — tiny captions */
  xxs: 10,
  /** 11px — count labels, nav labels */
  xs: 11,
  /** 12px — section headers, meta text */
  sm: 12,
  /** 13.6px — filter tabs, artist names */
  md: 13.6,
  /** 15.2px — body text, song titles, search input */
  base: 15.2,
  /** 17.6px — lyric lines */
  lg: 17.6,
  /** 28.8px — lyrics song title */
  xl: 28.8,
  /** 32px — artist detail name */
  xxl: 32,
  /** 35.2px — page titles (Artists, Songs, etc.) */
  xxxl: 35.2,
} as const;

/** Line heights */
export const lineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

/**
 * Pre-composed text style variants for use with AppText.
 * Interns should use variant="xxx" rather than custom styles.
 */
export const textVariants = {
  /** Page titles — "Artists", "Songs", "Search", "Saved Lyrics" */
  pageTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize.xxxl * lineHeight.tight,
  } satisfies TextStyle,

  /** Detail name — artist detail name */
  detailTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize.xxl * lineHeight.tight,
  } satisfies TextStyle,

  /** Song/lyrics title in header */
  sectionTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
    lineHeight: fontSize.xl * lineHeight.tight,
  } satisfies TextStyle,

  /** Avatar initials */
  avatarLetter: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxl * lineHeight.normal,
  } satisfies TextStyle,

  /** Card/grid avatar initials (smaller) */
  avatarLetterSmall: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.xxl * 0.6,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xxl * 0.6 * lineHeight.normal,
  } satisfies TextStyle,

  /** Page subtitle — "Browse lyrics by artist" */
  pageSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
  } satisfies TextStyle,

  /** Section header — "POPULAR SONGS", "ALBUMS" */
  sectionHeader: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,

  /** Song item title */
  itemTitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.normal,
  } satisfies TextStyle,

  /** Song meta, result meta, stats */
  itemMeta: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
  } satisfies TextStyle,

  /** Artist name in card */
  cardTitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * lineHeight.normal,
  } satisfies TextStyle,

  /** Song count under card title */
  cardCaption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
  } satisfies TextStyle,

  /** Lyric line text */
  lyricLine: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.loose,
  } satisfies TextStyle,

  /** Verse label (VERSE 1, CHORUS, etc.) */
  verseLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  } satisfies TextStyle,

  /** Filter chip / tab label */
  chipLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.md * lineHeight.normal,
  } satisfies TextStyle,

  /** Search input placeholder/text */
  searchInput: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.normal,
  } satisfies TextStyle,

  /** Bottom nav label */
  navLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xs * lineHeight.normal,
  } satisfies TextStyle,

  /** Action button label (Save, Share, etc.) */
  actionLabel: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.semibold,
    lineHeight: (fontSize.sm + 1) * lineHeight.normal,
  } satisfies TextStyle,

  /** Preview snippet in saved collection */
  preview: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm + 1,
    fontWeight: fontWeight.regular,
    fontStyle: 'italic' as const,
    lineHeight: (fontSize.sm + 1) * lineHeight.relaxed,
  } satisfies TextStyle,
} as const;

export type TextVariant = keyof typeof textVariants;
