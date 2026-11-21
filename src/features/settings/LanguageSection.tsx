import { StyleSheet, Text, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { RadioCardGroup, type RadioCardOption } from '@/components/molecules/RadioCardGroup';
import copy, { LANGUAGE_NAMES } from '@/features/language/language.copy';
import { setLocale } from '@/shared/i18n/locale.store';
import { LOCALES, type Locale } from '@/shared/i18n/locale.types';
import { useLocale } from '@/shared/i18n/useLocale';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const OPTIONS: readonly RadioCardOption<Locale>[] = LOCALES.map((locale) => ({
  value: locale,
  label: LANGUAGE_NAMES[locale],
  icon: 'language-outline',
}));

/** Idioma (Ajustes): español o inglés. El cambio se aplica al instante y se recuerda. */
export function LanguageSection() {
  const locale = useLocale();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.SECTION_TITLE} />
      <RadioCardGroup<Locale> accessibilityLabel={copy.GROUP_LABEL} options={OPTIONS} value={locale} onChange={(next) => void setLocale(next)} />
      <Text style={styles.hint}>{copy.HINT}</Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    hint: { ...typography.label, color: colors.textSecondary },
  });
