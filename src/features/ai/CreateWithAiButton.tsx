import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { AiConsentSheet } from './AiConsentSheet';
import * as copy from './ai.copy';
import { useAiAccess } from './useAiAccess';

/** Punto de entrada secundario a "Crear con IA" (P10 y estado vacío de Inicio). No aparece si la IA está apagada. */
export function CreateWithAiButton() {
  const styles = useThemedStyles(createStyles);
  const ai = useAiAccess();
  if (!ai.visible) return null;

  return (
    <View style={styles.group}>
      <SecondaryButton
        icon="sparkles-outline"
        label={copy.CREATE_WITH_AI_LABEL}
        onPress={() => ai.whenConsented(() => router.push('/routine/ai'))}
        disabled={!ai.online}
      />
      {ai.online ? null : <Text style={styles.hint}>{copy.OFFLINE_HINT}</Text>}
      <AiConsentSheet {...ai.consent} />
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    group: {
      gap: spacing.xs,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
