import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/atoms/Chip';
import { IconButton } from '@/components/atoms/IconButton';
import { PENDING_SYNC_LABEL } from '@/features/sync/sync.copy';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDuration } from '@/shared/utils/formatDuration';

import * as copy from './history.copy';
import { parseCheckedItems, type CheckedItem } from './history.filter';
import { describeResult } from './history.result';
import type { HistoryEntry } from './history.types';

interface RecordDetailSheetProps {
  entry: HistoryEntry;
  onClose(): void;
}

/** Hoja de detalle de un registro (P09): rutina, fecha y hora, resultado, ítems y duración. */
export function RecordDetailSheet({ entry, onClose }: RecordDetailSheetProps) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const result = describeResult(entry.result);
  const items = parseCheckedItems(entry.itemsChecked);
  const checked = items.filter((item) => item.checked);
  const skipped = items.filter((item) => !item.checked);

  const itemList = (title: string, list: CheckedItem[], icon: 'checkmark-circle' | 'close-circle-outline') =>
    list.length > 0 ? (
      <View style={styles.block}>
        <Text style={styles.blockTitle}>{title}</Text>
        {list.map((item, index) => (
          <View
            key={`${item.label}-${index}`}
            style={styles.itemRow}
            accessible
            accessibilityLabel={item.critical ? `${item.label}, ${copy.CRITICAL_LABEL}` : item.label}
          >
            <Ionicons name={icon} size={iconSizes.md} color={item.checked ? colors.primary : colors.textMuted} />
            <Text style={styles.itemLabel}>{item.label}</Text>
            {item.critical ? (
              <View style={styles.critical}>
                <Ionicons name="flag" size={iconSizes.sm} color={colors.criticalText} />
                <Text style={styles.criticalText}>{copy.CRITICAL_LABEL}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    ) : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={copy.DETAIL_CLOSE_LABEL} />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
              {entry.routineName}
            </Text>
            <IconButton icon="close" accessibilityLabel={copy.DETAIL_CLOSE_LABEL} onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Chip tone={result.tone} icon={result.icon} label={result.label} />
            {itemList(copy.DETAIL_CHECKED_TITLE, checked, 'checkmark-circle')}
            {itemList(copy.DETAIL_SKIPPED_TITLE, skipped, 'close-circle-outline')}
            {items.length > 0 && checked.length === 0 ? <Text style={styles.secondary}>{copy.DETAIL_NO_ITEMS}</Text> : null}
            {/* Datos del sistema, debajo del contenido de la persona (Documento de Jerarquía). */}
            <View style={styles.block}>
              <Text style={styles.secondary}>{copy.recordDateTime(entry.date)}</Text>
              {entry.durationSeconds !== null ? (
                <Text style={styles.secondary}>
                  {copy.DETAIL_DURATION_TITLE}: {formatDuration(entry.durationSeconds)}
                </Text>
              ) : null}
              {entry.pending ? <Text style={styles.secondary}>{PENDING_SYNC_LABEL}</Text> : null}
            </View>
          </ScrollView>
        </View>
      </View>
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
      maxHeight: '85%',
      borderTopLeftRadius: radii.xxl,
      borderTopRightRadius: radii.xxl,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
    },
    content: {
      gap: spacing.lg,
      padding: spacing.xl,
    },
    block: {
      gap: spacing.sm,
    },
    blockTitle: {
      ...typography.labelMedium,
      color: colors.textSecondary,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    itemLabel: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    critical: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radii.sm,
      backgroundColor: colors.criticalBg,
    },
    criticalText: {
      ...typography.caption,
      color: colors.criticalText,
    },
    secondary: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
