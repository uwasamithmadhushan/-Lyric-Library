import { Platform, ViewStyle } from 'react-native';

function webShadow(value: string): ViewStyle {
  return { boxShadow: value } as ViewStyle;
}

/** Elevation/shadow presets matching wireframe box-shadows */
export const shadows = {
  /** Subtle card shadow — box-shadow: 0 2px 8px rgba(0,0,0,0.04) */
  card:
    Platform.OS === 'web'
      ? webShadow('0px 2px 8px rgba(0,0,0,0.04)')
      : ({
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        } as ViewStyle),

  /** Search bar active — box-shadow: 0 4px 16px rgba(124,58,237,0.2) */
  searchActive:
    Platform.OS === 'web'
      ? webShadow('0px 4px 16px rgba(124,58,237,0.2)')
      : ({
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 4,
        } as ViewStyle),

  /** Avatar glow — box-shadow: 0 8px 24px rgba(124,58,237,0.3) */
  avatarGlow:
    Platform.OS === 'web'
      ? webShadow('0px 8px 24px rgba(124,58,237,0.3)')
      : ({
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 24,
          elevation: 6,
        } as ViewStyle),

  /** No shadow */
  none:
    Platform.OS === 'web'
      ? webShadow('none')
      : ({
          shadowColor: 'transparent',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0,
          shadowRadius: 0,
          elevation: 0,
        } as ViewStyle),
} as const;

export type ShadowKey = keyof typeof shadows;
