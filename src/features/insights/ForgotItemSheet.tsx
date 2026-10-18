import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/atoms/IconButton';
import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { TextField } from '@/components/atoms/TextField';
import { BottomSheet } from '@/components/organisms/BottomSheet';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { ITEM_LABEL_MAX_LENGTH } from '@/features/routines/routine.validation';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './insights.copy';

interface ForgotItemSheetProps {
  saving: boolean;
  error: string | null;
  onSave(label: string): void;
  onClose(): void;
}

/** "Olvidé algo": una sola pregunta y un botón. */
export function ForgotItemSheet({ saving, error, onSave, onClose }: ForgotItemSheetProps) {
  const styles = useThemedStyles(createStyles);
  const [label, setLabel] = useState('');

  return (
    <BottomSheet
      onRequestClose={onClose}
      closeLabel={copy.FORGOT_CLOSE}
      header={
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            {copy.FORGOT_TITLE}
          </Text>
          <IconButton icon="close" accessibilityLabel={copy.FORGOT_CLOSE} onPress={onClose} />
        </View>
      }
    >
      <View style={styles.content}>
        <TextField
          label={copy.FORGOT_FIELD}
          placeholder={copy.FORGOT_PLACEHOLDER}
          value={label}
          onChangeText={setLabel}
          maxLength={ITEM_LABEL_MAX_LENGTH}
          showCounter
          autoFocus
          returnKeyType="done"
          onSubmitEditing={() => onSave(label)}
          error={error ?? undefined}
        />
      </View>
      <ScreenFooter bordered>
        <PrimaryButton label={copy.FORGOT_SAVE} onPress={() => onSave(label)} loading={saving} />
      </ScreenFooter>
    </BottomSheet>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    content: {
      padding: spacing.xl,
    },
  });
