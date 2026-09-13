import React, { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  useColorScheme,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppScreen, AppText } from '@/components';
import { APP_BACKGROUNDS, radii, shadows, spacing } from '@/theme';
import { useUIStore } from '@/store';
import { useTheme } from '@/hooks/useTheme';

export default function ProfileSettingsScreen() {
  const { colors: palette } = useTheme();
  const themeMode = useUIStore((state) => state.themeMode);
  const setThemeMode = useUIStore((state) => state.setThemeMode);
  const backgroundId = useUIStore((state) => state.backgroundId);
  const setBackgroundId = useUIStore((state) => state.setBackgroundId);
  const customBackgroundUri = useUIStore((state) => state.customBackgroundUri);
  const setCustomBackgroundUri = useUIStore((state) => state.setCustomBackgroundUri);
  const systemScheme = useColorScheme();
  const [textSize, setTextSize] = useState<'small'|'medium'|'large'>('medium');
  const [lineSpacing, setLineSpacing] = useState<'compact'|'comfortable'>('comfortable');
  const [autoScroll, setAutoScroll] = useState(false);
  const [pickingImage, setPickingImage] = useState(false);

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const customActive = backgroundId === 'custom' && Boolean(customBackgroundUri);

  async function pickOwnBackground() {
    setPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Allow photo access to set your own app background.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.55,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      const uri =
        asset.base64 != null
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri;

      setCustomBackgroundUri(uri);
      setBackgroundId('custom');
    } catch {
      Alert.alert('Could not open photos', 'Try again or pick a different image.');
    } finally {
      setPickingImage(false);
    }
  }

  function clearOwnBackground() {
    setCustomBackgroundUri(null);
    if (backgroundId === 'custom') {
      setBackgroundId('default');
    }
  }

  return (
    <AppScreen padded={false} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.heroCard, { backgroundColor: palette.bgElevated, borderColor: palette.border }]}>
          <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
            <AppText variant="avatarLetterSmall" color={palette.white} center>
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
              <AppText variant="itemMeta" color={palette.primary}>
                Web profile
              </AppText>
            </View>
            <View style={[styles.metaPillSecondary, { backgroundColor: palette.secondaryLight }]}>
              <AppText variant="itemMeta" color={palette.secondary}>
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

          <AppText variant="itemTitle" color={palette.textPrimary} style={styles.fieldLabel}>
            App Background
          </AppText>
          <AppText variant="itemMeta" color={palette.textTertiary} style={styles.backgroundHint}>
            Pick a look — updates for light & dark
          </AppText>
          <View style={styles.backgroundGrid}>
            {APP_BACKGROUNDS.map((preset) => {
              const swatch = isDark ? preset.dark.swatch : preset.light.swatch;
              const active = backgroundId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => setBackgroundId(preset.id)}
                  style={({ pressed }) => [
                    styles.backgroundCard,
                    {
                      backgroundColor: palette.bgSecondary,
                      borderColor: active ? palette.primary : palette.border,
                    },
                    active && styles.backgroundCardActive,
                    pressed && styles.chipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${preset.label} background`}
                >
                  <View style={[styles.backgroundSwatch, { backgroundColor: swatch }]} />
                  <AppText
                    variant="itemMeta"
                    color={active ? palette.primary : palette.textPrimary}
                    numberOfLines={1}
                    style={styles.backgroundLabel}
                  >
                    {preset.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.customBackgroundCard,
              {
                backgroundColor: palette.bgSecondary,
                borderColor: customActive ? palette.primary : palette.border,
              },
              customActive && styles.backgroundCardActive,
            ]}
          >
            {customBackgroundUri ? (
              <Image
                source={{ uri: customBackgroundUri }}
                style={styles.customPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.customPreview, { backgroundColor: palette.border }]} />
            )}
            <View style={styles.customTextBlock}>
              <AppText variant="chipLabel" color={palette.textPrimary}>
                Your photo
              </AppText>
              <View style={styles.customActions}>
                <Pressable
                  onPress={() => void pickOwnBackground()}
                  disabled={pickingImage}
                  style={[styles.customBtn, { backgroundColor: palette.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Choose background photo"
                >
                  <AppText variant="itemMeta" color={palette.white}>
                    {pickingImage ? '…' : customBackgroundUri ? 'Change' : 'Add photo'}
                  </AppText>
                </Pressable>
                {customBackgroundUri ? (
                  <>
                    {!customActive ? (
                      <Pressable
                        onPress={() => setBackgroundId('custom')}
                        style={[styles.customBtnSecondary, { borderColor: palette.border }]}
                      >
                        <AppText variant="itemMeta" color={palette.textSecondary}>
                          Use
                        </AppText>
                      </Pressable>
                    ) : null}
                    <Pressable
                      onPress={clearOwnBackground}
                      style={[styles.customBtnSecondary, { borderColor: palette.border }]}
                    >
                      <AppText variant="itemMeta" color={palette.textSecondary}>
                        Remove
                      </AppText>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
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
            />
            <ChoiceChip
              label="Medium"
              active={textSize === 'medium'}
              onPress={() => setTextSize('medium')}
            />
            <ChoiceChip
              label="Large"
              active={textSize === 'large'}
              onPress={() => setTextSize('large')}
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
            />
            <ChoiceChip
              label="Comfortable"
              active={lineSpacing === 'comfortable'}
              onPress={() => setLineSpacing('comfortable')}
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
      </ScrollView>
    </AppScreen>
  );
}

interface ChoiceChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function ChoiceChip({ label, active, onPress }: Readonly<ChoiceChipProps>) {
  const { colors: palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? palette.primary : palette.bgSecondary,
          borderColor: active ? palette.primary : palette.border,
        },
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <AppText variant="chipLabel" color={active ? palette.white : palette.textPrimary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.xl,
    paddingBottom: spacing.massive,
  },
  heroCard: {
    width: '100%',
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
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
  },
  metaPillSecondary: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
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
  backgroundHint: {
    marginTop: -spacing.xs,
  },
  backgroundGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  backgroundCard: {
    width: '31%',
    flexGrow: 1,
    minWidth: 88,
    maxWidth: '33%',
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 4,
    alignItems: 'center',
  },
  backgroundCardActive: {
    borderWidth: 2,
  },
  backgroundSwatch: {
    width: '100%',
    height: 22,
    borderRadius: radii.sm,
  },
  backgroundLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  customBackgroundCard: {
    marginTop: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  customPreview: {
    width: 52,
    height: 52,
    borderRadius: radii.sm,
  },
  customTextBlock: {
    flex: 1,
    gap: 4,
  },
  customActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  customBtn: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  customBtnSecondary: {
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
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
