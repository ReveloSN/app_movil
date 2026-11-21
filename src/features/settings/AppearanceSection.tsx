import { StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { RadioCardGroup, type RadioCardOption } from '@/components/molecules/RadioCardGroup';
import { useThemeMode, type ThemePreference } from '@/shared/theme/themeMode.context';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import settingsCopy from './settings.copy';

// Función y no constante: los textos se leen al dibujar, con el idioma activo.
const themeOptions = (): readonly RadioCardOption<ThemePreference>[] => [
  { value: 'light', label: settingsCopy.THEME_LIGHT_LABEL, icon: 'sunny-outline' },
  { value: 'dark', label: settingsCopy.THEME_DARK_LABEL, icon: 'moon-outline' },
  { value: 'system', label: settingsCopy.THEME_SYSTEM_LABEL, icon: 'phone-portrait-outline' },
];

/** Apariencia (P11): tema claro, oscuro o el del sistema. Cada opción mide ≥ 56 dp y es un radio accesible. */
export function AppearanceSection() {
  const { preference, setPreference } = useThemeMode();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <SectionLabel label={settingsCopy.APPEARANCE_SECTION_TITLE} />
      <RadioCardGroup<ThemePreference>
        accessibilityLabel={settingsCopy.APPEARANCE_GROUP_LABEL}
        options={themeOptions()}
        value={preference}
        onChange={setPreference}
      />
      <Text style={styles.hint}>{settingsCopy.THEME_SYSTEM_HINT}</Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    hint: { ...typography.label, color: colors.textSecondary },
  });
