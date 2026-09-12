import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppScreen, AppText } from '@/components';
import { colors, radii, shadows, spacing } from '@/theme';
import { useUIStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';

export default function ProfileSettingsScreen() {
  const { colors: palette } = useTheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const setThemeMode = useUIStore((state) => state.setThemeMode);
  const [textSize, setTextSize] = useState<'small'|'medium'|'large'>('medium');
  const [lineSpacing, setLineSpacing] = useState<'compact'|'comfortable'>('comfortable');
  const [autoScroll, setAutoScroll] = useState(false);

  const isDark = themeMode === 'dark';

  return (
    <AppScreen backgroundColor={palette.bgSecondary} padded={false} style={styles.screen}>
      <View style={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
          <View style={styles.avatar}>
            <AppText variant="avatarLetterSmall" color={colors.white} center>
              U
            </AppText>
          </View>

          <AppText variant="pageTitle" color={palette.textPrimary}>
            Lyric Library User
          </AppText>
          <AppText variant="pageSubtitle" color={palette.textSecondary}>
            Lyrics enthusiast
          </AppText>

          <View style={styles.heroMetaRow}>
            <View style={[styles.metaPill, { backgroundColor: palette.primaryLight }]}>
              <AppText variant="itemMeta" color={colors.primary}>
                Web profile
              </AppText>
            </View>
            <View style={[styles.metaPillSecondary, { backgroundColor: palette.secondaryLight }]}>
              <AppText variant="itemMeta" color={colors.secondary}>
                Personalized reading
              </AppText>
            </View>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
          <AppText variant="sectionHeader" color={palette.textTertiary}>
            Appearance
          </AppText>
          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <AppText variant="itemTitle" color={palette.textPrimary}>
                Dark Mode
              </AppText>
              <AppText variant="itemMeta" color={palette.textTertiary}>
                Switch the app theme
              </AppText>
            </View>
            <Switch value={isDark} onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')} />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
          <AppText variant="sectionHeader" color={palette.textTertiary}>
            Lyrics
          </AppText>
          <AppText variant="itemTitle" color={palette.textPrimary} style={styles.fieldLabel}>
            Text Size
          </AppText>
          <View style={styles.segmentRow}>
            <ChoiceChip
              label="Small"
              active={textSize === 'small'}
              onPress={() => setTextSize('small')}
              palette={palette}
            />
            <ChoiceChip
              label="Medium"
              active={textSize === 'medium'}
              onPress={() => setTextSize('medium')}
              palette={palette}
            />
            <ChoiceChip
              label="Large"
              active={textSize === 'large'}
              onPress={() => setTextSize('large')}
              palette={palette}
            />
          </View>

          <AppText variant="itemTitle" color={palette.textPrimary} style={styles.fieldLabel}>
            Line Spacing
          </AppText>
          <View style={styles.segmentRow}>
            <ChoiceChip
              label="Compact"
              active={lineSpacing === 'compact'}
              onPress={() => setLineSpacing('compact')}
              palette={palette}
            />
            <ChoiceChip
              label="Comfortable"
              active={lineSpacing === 'comfortable'}
              onPress={() => setLineSpacing('comfortable')}
              palette={palette}
            />
          </View>

          <View style={[styles.previewCard, { backgroundColor: palette.primaryLight }]}>
            <AppText
              variant="lyricLine"
              color={palette.textPrimary}
              style={[
                styles.previewText,
                textSize === 'small' && styles.previewTextSmall,
                textSize === 'large' && styles.previewTextLarge,
                lineSpacing === 'compact' && styles.previewCompact,
                lineSpacing === 'comfortable' && styles.previewComfortable,
              ]}
            >
              Preview: your text size and spacing choices now update this sample.
            </AppText>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
          <AppText variant="sectionHeader" color={palette.textTertiary}>
            Reading
          </AppText>
          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <AppText variant="itemTitle" color={palette.textPrimary}>
                Auto Scroll
              </AppText>
              <AppText variant="itemMeta" color={palette.textTertiary}>
                Move through lyrics while playing
              </AppText>
            </View>
            <Switch value={autoScroll} onValueChange={setAutoScroll} />
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
          <AppText variant="sectionHeader" color={palette.textTertiary}>
            App
          </AppText>
          <View style={styles.settingRow}>
            <View style={styles.settingTextBlock}>
              <AppText variant="itemTitle" color={palette.textPrimary}>
                Version
              </AppText>
              <AppText variant="itemMeta" color={palette.textTertiary}>
                1.0.0
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

interface ChoiceChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  palette: {
    card: string;
    border: string;
    text: string;
    muted: string;
    subtext: string;
    chip: string;
  };
}

function ChoiceChip({ label, active, onPress, palette }: Readonly<ChoiceChipProps>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? colors.primary : palette.chip, borderColor: active ? colors.primary : palette.border },
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <AppText variant="chipLabel" color={active ? colors.white : palette.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
    gap: spacing.sm,
    ...shadows.card,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  metaPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
  },
  metaPillSecondary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.secondaryLight,
  },
  sectionCard: {
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    gap: spacing.md,
    ...shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
  },
  settingTextBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  fieldLabel: {
    marginTop: spacing.xs,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  chipActive: {
  },
  chipPressed: {
    opacity: 0.92,
  },
  previewCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  previewText: {
    lineHeight: 24,
  },
  previewTextSmall: {
    fontSize: 13,
  },
  previewTextLarge: {
    fontSize: 18,
  },
  previewCompact: {
    lineHeight: 18,
  },
  previewComfortable: {
    lineHeight: 30,
  },
});
