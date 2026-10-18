import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { RoutinePreview } from '@/components/molecules/RoutinePreview';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { CRITICAL_LABEL } from '@/features/routines/routine.copy';
import { resolveRoutineIcon, routineAccent } from '@/features/routines/routine-appearance';
import * as copy from '@/features/routines/share/share.copy';
import { useImportRoutine } from '@/features/routines/share/useImportRoutine';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** "Tengo un código": pegar, revisar la vista previa y añadir una copia a mis rutinas. */
export default function ImportRoutineScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useAppTheme();
  const routine = useImportRoutine();
  const preview = routine.preview;
  const accent = routineAccent(colors, preview?.color);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label={copy.CODE_FIELD}
          placeholder={copy.CODE_PLACEHOLDER}
          value={routine.code}
          onChangeText={routine.setCode}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={6000}
        />
        <Text style={styles.hint}>{copy.CODE_HINT}</Text>
        <SecondaryButton icon="eye-outline" label={copy.REVIEW_LABEL} onPress={routine.review} />
        {routine.error ? <StatusMessage tone="error" message={routine.error} /> : null}
        {preview ? (
          <RoutinePreview
            title={copy.PREVIEW_TITLE}
            name={preview.name}
            icon={resolveRoutineIcon(preview.icon)}
            accentColor={accent.color}
            accentTint={accent.tint}
            countLabel={copy.itemsCount(preview.items.length)}
            items={preview.items}
            criticalLabel={CRITICAL_LABEL}
          />
        ) : null}
      </ScrollView>
      <ScreenFooter bordered>
        <PrimaryButton label={copy.ADD_LABEL} onPress={() => void routine.add()} loading={routine.saving} disabled={!preview} />
      </ScreenFooter>
    </KeyboardAvoidingView>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
