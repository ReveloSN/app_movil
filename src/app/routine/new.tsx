import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextField } from '@/components/atoms/TextField';
import { ItemFormRow } from '@/components/molecules/ItemFormRow';
import { ITEM_KIND_OPTIONS } from '@/features/routines/item-kinds';
import { ITEM_LABEL_MAX_LENGTH, MAX_ITEMS, ROUTINE_NAME_MAX_LENGTH } from '@/features/routines/routine.validation';
import { useRoutineForm } from '@/features/routines/useRoutineForm';
import { useRoutines } from '@/features/routines/useRoutines';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

function goBackToRoutines() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}

export default function NewRoutineScreen() {
  const { createRoutine } = useRoutines();
  const styles = useThemedStyles(createStyles);
  const form = useRoutineForm({ createRoutine, onSaved: goBackToRoutines });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField
          label="Nombre de la rutina"
          placeholder="Ej. Salir al trabajo"
          value={form.name}
          onChangeText={form.setName}
          maxLength={ROUTINE_NAME_MAX_LENGTH}
          showCounter
          error={form.errors.name}
        />

        <Text style={styles.sectionTitle} accessibilityRole="header">
          Ítems ({form.items.length}/{MAX_ITEMS})
        </Text>
        {form.errors.items ? <StatusMessage tone="error" message={form.errors.items} /> : null}

        {form.items.map((item, index) => (
          <ItemFormRow
            key={item.key}
            index={index}
            label={item.label}
            labelMaxLength={ITEM_LABEL_MAX_LENGTH}
            labelError={form.errors.itemLabels?.[index]}
            onChangeLabel={(label) => form.updateItem(item.key, { label })}
            type={item.kind}
            typeOptions={ITEM_KIND_OPTIONS}
            onChangeType={(kind) => form.updateItem(item.key, { kind })}
            critical={item.critical}
            onChangeCritical={(critical) => form.updateItem(item.key, { critical })}
            removable={form.items.length > 1}
            onRemove={() => form.removeItem(item.key)}
          />
        ))}

        <SecondaryButton icon="add" label="Añadir ítem" onPress={form.addItem} disabled={!form.canAddItem} />

        {form.submitError ? <StatusMessage tone="error" message={form.submitError} /> : null}
        <PrimaryButton label="Guardar cambios" onPress={form.submit} loading={form.submitting} />
      </ScrollView>
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
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
  });
