import type { StyleProp, ViewStyle } from 'react-native';

import { SyncStatusRow } from '@/components/molecules/SyncStatusRow';

import { failedLabel, pendingLabel, SYNCING_LABEL } from './sync.copy';
import { useSync } from './SyncProvider';

/** Indicador de Inicio: solo aparece si hay algo sin subir, subiéndose o con error. */
export function PendingSyncIndicator({ style }: { style?: StyleProp<ViewStyle> }) {
  const { pendingCount, failedChanges, syncing } = useSync();

  if (failedChanges.length > 0) {
    return <SyncStatusRow icon="alert-circle-outline" tone="error" label={failedLabel(failedChanges.length)} style={style} />;
  }
  if (pendingCount === 0) return null;
  return syncing ? (
    <SyncStatusRow icon="sync-outline" label={SYNCING_LABEL} style={style} busy />
  ) : (
    <SyncStatusRow icon="cloud-upload-outline" label={pendingLabel(pendingCount)} style={style} />
  );
}
