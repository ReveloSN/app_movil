import { StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { RadioCardGroup, type RadioCardOption } from '@/components/molecules/RadioCardGroup';
import { useThemeMode, type ThemePreference } from '@/shared/theme/themeMode.context';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import {
  APPEARANCE_GROUP_LABEL,
  APPEARANCE_SECTION_TITLE,
  THEME_DARK_LABEL,
  THEME_LIGHT_LABEL,
  THEME_SYSTEM_HINT,
  THEME_SYSTEM_LABEL,
} from './settings.copy';

const OPTIONS: readonly RadioCardOption<ThemePreference>[] = [
  { value: 'light', label: THEME_LIGHT_LABEL, icon: 'sunny-outline' },
  { value: 'dark', label: THEME_DARK_LABEL, icon: 'moon-outline' },
  { value: 'system', label: THEME_SYSTEM_LABEL, icon: 'phone-portrait-outline' },
];

/** Apariencia (P11): tema claro, oscuro o el del sistema. Cada opción mide ≥ 56 dp y es un radio accesible. */
export function AppearanceSection() {
  const { preference, setPreference } = useThemeMode();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <SectionLabel label={APPEARANCE_SECTION_TITLE} />
      <RadioCardGroup<ThemePreference>
        accessibilityLabel={APPEARANCE_GROUP_LABEL}
        options={OPTIONS}
        value={preference}
        onChange={setPreference}
      />
      <Text style={styles.hint}>{THEME_SYSTEM_HINT}</Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    hint: { ...typography.label, color: colors.textSecondary },
  });
