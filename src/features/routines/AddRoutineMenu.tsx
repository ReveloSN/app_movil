import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FloatingActionButton } from '@/components/atoms/FloatingActionButton';
import { SheetOptionRow } from '@/components/molecules/SheetOptionRow';
import { BottomSheet } from '@/components/organisms/BottomSheet';
import { AiConsentSheet } from '@/features/ai/AiConsentSheet';
import * as aiCopy from '@/features/ai/ai.copy';
import { useAiAccess } from '@/features/ai/useAiAccess';
import { BROWSE_TEMPLATES_LABEL } from '@/features/routine-templates/routine-templates.copy';
import { useBottomInset } from '@/shared/hooks/useBottomInset';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './add-routine.copy';

interface AddRoutineMenuProps {
  /** Posición del botón "+" (la pantalla lo ancla). */
  containerStyle?: ComponentProps<typeof FloatingActionButton>['containerStyle'];
}

/** Botón "+" de Inicio: abre una hoja con las formas de empezar una rutina (propia, con IA o desde una plantilla). */
export function AddRoutineMenu({ containerStyle }: AddRoutineMenuProps) {
  const styles = useThemedStyles(createStyles);
  const bottomInset = useBottomInset();
  const ai = useAiAccess();
  const [open, setOpen] = useState(false);

  // Cierra la hoja y navega: así no queda abierta al volver.
  const go = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <>
      <FloatingActionButton accessibilityLabel={copy.ADD_ROUTINE_LABEL} onPress={() => setOpen(true)} containerStyle={containerStyle} />
      <BottomSheet visible={open} onRequestClose={() => setOpen(false)} closeLabel={copy.ADD_MENU_CLOSE_LABEL}>
        <View style={[styles.sheet, { paddingBottom: bottomInset + styles.sheet.paddingTop }]}>
          <Text style={styles.title} accessibilityRole="header">
            {copy.ADD_MENU_TITLE}
          </Text>
          <SheetOptionRow icon="add-circle-outline" label={copy.NEW_ROUTINE_OPTION} onPress={go(() => router.push('/routine/new'))} />
          {ai.visible ? (
            <SheetOptionRow
              icon="sparkles-outline"
              label={aiCopy.CREATE_WITH_AI_LABEL}
              hint={ai.online ? undefined : aiCopy.OFFLINE_HINT}
              disabled={!ai.online}
              onPress={go(() => ai.whenConsented(() => router.push('/routine/ai')))}
            />
          ) : null}
          <SheetOptionRow icon="albums-outline" label={BROWSE_TEMPLATES_LABEL} onPress={go(() => router.push('/routine/templates'))} />
        </View>
      </BottomSheet>
      <AiConsentSheet {...ai.consent} />
    </>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    sheet: {
      paddingTop: spacing.md,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
    },
  });
