import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { CreateWithAiButton } from '@/features/ai/CreateWithAiButton';
import { HAVE_CODE_LABEL } from '@/features/routines/share/share.copy';
import { TemplateList } from '@/features/routine-templates/TemplateList';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** P10. No guarda nada: "Usar plantilla" abre P04 con el borrador precargado para revisarlo. */
export default function TemplatesScreen() {
  const styles = useThemedStyles(createStyles);
  return (
    <TemplateList
      // Alternativa secundaria a las plantillas: no aparece si la IA está apagada en Ajustes.
      header={
        <View style={styles.header}>
          <CreateWithAiButton />
          {/* Importar una rutina que alguien compartió (se añade como copia). */}
          <SecondaryButton icon="qr-code-outline" label={HAVE_CODE_LABEL} onPress={() => router.push('/routine/import')} />
        </View>
      }
      onUse={(template) => router.push({ pathname: '/routine/new', params: { templateId: template.id } })}
    />
  );
}

const createStyles = ({ spacing }: AppTheme) =>
  StyleSheet.create({
    header: {
      gap: spacing.sm,
      paddingBottom: spacing.md,
    },
  });
