import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/components/atoms/IconButton';
import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { TextField } from '@/components/atoms/TextField';
import { ScreenFooter } from '@/components/organisms/ScreenFooter';
import { IconPicker } from '@/components/molecules/IconPicker';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { UnsavedChangesDialog } from '@/features/forms/UnsavedChangesDialog';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { ITEM_ICONS, resolveItemIcon } from './item-icons';
import { ITEM_KIND_OPTIONS } from './item-kinds';
import * as copy from './routine.copy';
import { ITEM_LABEL_MAX_LENGTH, ITEM_NOTE_MAX_LENGTH } from './routine.validation';
import type { ItemDraft, ItemKind } from './routines.types';
import { useItemEditor } from './useItemEditor';

interface ItemEditSheetProps<T extends ItemDraft> {
  /** Ítem a editar (o uno en blanco para crear). La hoja se monta de nuevo para cada ítem. */
  item: T;
  isNew: boolean;
  onSave(item: T): void;
  onClose(): void;
}

/** P05 como hoja inferior sobre P04: etiqueta*, ícono, tipo, crítico y nota. */
export function ItemEditSheet<T extends ItemDraft>({ item, isNew, onSave, onClose }: ItemEditSheetProps<T>) {
  const styles = useThemedStyles(createStyles);
  const editor = useItemEditor(item);
  const [confirmingClose, setConfirmingClose] = useState(false);

  function save() {
    const result = editor.commit();
    if (result) onSave(result);
  }

  // DC-03: cerrar con cambios pregunta; sin cambios cierra.
  function requestClose() {
    if (editor.dirty) setConfirmingClose(true);
    else onClose();
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={requestClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={styles.backdrop} onPress={requestClose} accessibilityLabel={copy.CLOSE_ITEM_LABEL} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.header}>
              <Text style={styles.title} accessibilityRole="header">
                {isNew ? copy.NEW_ITEM_TITLE : copy.EDIT_ITEM_TITLE}
              </Text>
              <IconButton icon="close" accessibilityLabel={copy.CLOSE_ITEM_LABEL} onPress={requestClose} />
            </View>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {/* 05-1 */}
              <TextField
                label={copy.ITEM_LABEL_FIELD}
                placeholder="Ej. Llaves"
                value={editor.label}
                onChangeText={editor.setLabel}
                maxLength={ITEM_LABEL_MAX_LENGTH}
                showCounter
                error={editor.errors.label}
                autoFocus={isNew}
              />
              {/* 05-2 */}
              <SectionLabel label={copy.ICON_LABEL} />
              <IconPicker
                accessibilityLabel={copy.ITEM_ICON_GROUP_LABEL}
                options={ITEM_ICONS}
                value={resolveItemIcon(editor.icon).icon}
                onChange={editor.setIcon}
              />
              {/* 05-3 */}
              <SectionLabel label={copy.ITEM_KIND_LABEL} />
              <SegmentedControl<ItemKind>
                accessibilityLabel={copy.ITEM_KIND_LABEL}
                options={ITEM_KIND_OPTIONS}
                value={editor.kind}
                onChange={editor.setKind}
              />
              {/* 05-4 */}
              <SwitchRow icon="flag-outline" label={copy.CRITICAL_SWITCH_LABEL} value={editor.critical} onValueChange={editor.setCritical} />
              {/* 05-5 */}
              <TextField
                label={copy.ITEM_NOTE_FIELD}
                placeholder={copy.ITEM_NOTE_PLACEHOLDER}
                value={editor.note}
                onChangeText={editor.setNote}
                maxLength={ITEM_NOTE_MAX_LENGTH}
                showCounter
                error={editor.errors.note}
              />
            </ScrollView>
            <ScreenFooter bordered>
              <PrimaryButton label={copy.SAVE_CHANGES_LABEL} onPress={save} />
            </ScreenFooter>
          </View>
        </KeyboardAvoidingView>
      </View>
      <UnsavedChangesDialog
        visible={confirmingClose}
        onSave={() => {
          setConfirmingClose(false);
          save(); // Si no pasa la validación, la hoja sigue abierta con el error.
        }}
        onDiscard={() => {
          setConfirmingClose(false);
          onClose();
        }}
        onDismiss={() => setConfirmingClose(false)}
      />
    </Modal>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.scrim,
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      maxHeight: '90%',
      borderTopLeftRadius: radii.xxl,
      borderTopRightRadius: radii.xxl,
      backgroundColor: colors.surface,
    },
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
      gap: spacing.lg,
      padding: spacing.xl,
    },
  });
