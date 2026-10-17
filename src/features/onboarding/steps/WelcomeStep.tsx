import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { START_LABEL, WELCOME_BODY, WELCOME_TITLE } from '../onboarding.copy';

/** Paso 1: bienvenida. La "ilustración" es una puerta en un círculo (decorativa para el lector). */
export function WelcomeStep({ onStart }: { onStart(): void }) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.illustration} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="exit-outline" size={iconSizes.xl} color={colors.primary} />
          <Ionicons name="key-outline" size={iconSizes.lg} color={colors.criticalText} style={styles.key} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {WELCOME_TITLE}
        </Text>
        <Text style={styles.body}>{WELCOME_BODY}</Text>
      </ScrollView>
      <ScreenFooter>
        <PrimaryButton label={START_LABEL} onPress={onStart} />
      </ScreenFooter>
    </View>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: spacing.xl,
      padding: spacing.xl,
    },
    illustration: {
      alignSelf: 'center',
      width: sizes.largeIconCircle,
      height: sizes.largeIconCircle,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryTint,
    },
    key: {
      position: 'absolute',
      right: spacing.lg,
      bottom: spacing.lg,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
      textAlign: 'center',
    },
  });
