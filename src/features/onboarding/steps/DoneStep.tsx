import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { routineSavedMessage } from '@/features/triggers/trigger.copy';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from '../onboarding.copy';

interface DoneStepProps {
  /** Frases de los avisos creados (ej. "cuando salgas de Casa"); vacío si no hubo aviso. */
  phrases: readonly string[];
  onContinue(): void;
  continuing: boolean;
}

/** Paso 4: confirmación. Reusa CF-03 ("Rutina guardada. Te avisaremos …") con un cierre cálido. */
export function DoneStep({ phrases, onContinue, continuing }: DoneStepProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="checkmark" size={iconSizes.xl} color={colors.primary} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {copy.DONE_TITLE}
        </Text>
        <Text style={styles.message} accessibilityLiveRegion="polite">
          {routineSavedMessage(phrases)}
        </Text>
        <Text style={styles.body}>{phrases.length > 0 ? copy.DONE_WITH_TRIGGER : copy.DONE_WITHOUT_TRIGGER}</Text>
      </ScrollView>
      <ScreenFooter>
        <PrimaryButton label={copy.GO_TO_ROUTINES_LABEL} onPress={onContinue} loading={continuing} />
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
      gap: spacing.lg,
      padding: spacing.xl,
    },
    badge: {
      alignSelf: 'center',
      width: sizes.largeIconCircle,
      height: sizes.largeIconCircle,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryTint,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    message: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    body: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
