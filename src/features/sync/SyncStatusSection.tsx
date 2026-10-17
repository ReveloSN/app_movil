import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { FailedChangeRow } from '@/components/molecules/FailedChangeRow';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { useNetworkStatus } from '@/shared/network/useNetworkStatus';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDateTime } from '@/shared/utils/formatDateTime';

import {
  ALL_SYNCED,
  blockedHint,
  CANCEL_LABEL,
  DISCARD_LABEL,
  lastSyncedLabel,
  NEVER_SYNCED,
  OFFLINE_HINT,
  RETRY_LABEL,
  SYNC_NOW_LABEL,
  SYNC_SECTION_TITLE,
  SYNCING_LABEL,
  waitingLabel,
} from './sync.copy';
import { discardMessage } from './sync.describe';
import { useSync } from './SyncProvider';

const warn = (scope: string) => (cause: unknown) => {
  if (__DEV__) console.warn(`[sync.${scope}]`, cause);
};

/** Ajustes: "Cambios sin sincronizar". Estado, sincronizar ahora, y Reintentar / Descartar lo rechazado. */
export function SyncStatusSection() {
  const { pendingCount, blockedCount, failedChanges, syncing, lastSyncedAt, syncNow, retry, discard, previewDiscard } =
    useSync();
  const { isConnected } = useNetworkStatus();
  const styles = useThemedStyles(createStyles);
  const [confirming, setConfirming] = useState<{ opId: string; message: string } | null>(null);

  const nothingPending = pendingCount === 0 && failedChanges.length === 0;
  const lastSynced = lastSyncedAt ? formatDateTime(lastSyncedAt) : null;

  // Antes de descartar se dice qué más se va con el cambio (sus dependientes).
  function requestDiscard(opId: string) {
    previewDiscard(opId)
      .then((discarded) => setConfirming({ opId, message: discardMessage(discarded) }))
      .catch(warn('previewDiscard'));
  }

  function confirmDiscard() {
    if (!confirming) return;
    discard(confirming.opId).catch(warn('discard'));
    setConfirming(null);
  }

  return (
    <View style={styles.section}>
      <SectionLabel label={SYNC_SECTION_TITLE} />
      <View style={styles.card}>
        <Text style={styles.value}>{nothingPending ? ALL_SYNCED : waitingLabel(pendingCount + failedChanges.length)}</Text>
        {blockedCount > 0 ? <Text style={styles.hint}>{blockedHint(blockedCount)}</Text> : null}
        {!isConnected && !nothingPending ? <Text style={styles.hint}>{OFFLINE_HINT}</Text> : null}
        <Text style={styles.hint}>{lastSynced ? lastSyncedLabel(lastSynced) : NEVER_SYNCED}</Text>
      </View>

      {failedChanges.map((change) => (
        <FailedChangeRow
          key={change.opId}
          title={change.title}
          reason={change.reason}
          retryLabel={RETRY_LABEL}
          discardLabel={DISCARD_LABEL}
          onRetry={() => retry(change.opId).catch(warn('retry'))}
          onDiscard={() => requestDiscard(change.opId)}
        />
      ))}

      {nothingPending ? null : (
        <SecondaryButton
          icon="sync-outline"
          label={syncing ? SYNCING_LABEL : SYNC_NOW_LABEL}
          onPress={syncNow}
          disabled={syncing || !isConnected}
        />
      )}

      <ConfirmDialog
        visible={confirming !== null}
        message={confirming?.message ?? ''}
        confirmLabel={DISCARD_LABEL}
        cancelLabel={CANCEL_LABEL}
        onConfirm={confirmDiscard}
        onCancel={() => setConfirming(null)}
      />
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    card: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
    },
    hint: {
      ...typography.captionRegular,
      color: colors.textSecondary,
    },
  });
