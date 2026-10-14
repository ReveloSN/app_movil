import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { NetworkRow } from '@/components/molecules/NetworkRow';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { NETWORK_NAME_MAX_LENGTH } from '@/features/triggers/trigger.validation';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { formatDateTime } from '@/shared/utils/formatDateTime';

import * as copy from './settings.copy';
import { useHomeNetworks, validateNetworkName, type HomeNetworkView } from './useHomeNetworks';

const ROW_LABELS = { rename: copy.RENAME_LABEL, remove: copy.DELETE_LABEL, save: copy.SAVE_LABEL, cancel: copy.CANCEL_LABEL };

/**
 * Redes de casa (11-1). Una red que usa algún aviso no se puede eliminar: se explica por qué
 * (borrarla dejaría ese aviso sin red).
 */
export function HomeNetworksSection() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { networks, loading, error, actionError, refresh, rename, remove } = useHomeNetworks();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HomeNetworkView | null>(null);

  // Los avisos pudieron cambiar en otra pantalla: el conteo de uso se relee al volver.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  function startRename(network: HomeNetworkView) {
    setBlockedMessage(null);
    setEditingId(network.id);
    setDraftName(network.displayName);
    setNameError(undefined);
  }

  async function saveRename() {
    if (!editingId) return;
    const invalid = validateNetworkName(draftName);
    if (invalid) {
      setNameError(invalid);
      return;
    }
    setSaving(true);
    const saved = await rename(editingId, draftName);
    setSaving(false);
    if (saved) setEditingId(null);
  }

  function askRemove(network: HomeNetworkView) {
    setEditingId(null);
    if (network.usedBy > 0) {
      setBlockedMessage(copy.networkInUseMessage(network.displayName, network.usedBy));
      return;
    }
    setBlockedMessage(null);
    setPendingDelete(network);
  }

  function confirmRemove() {
    const target = pendingDelete;
    setPendingDelete(null);
    if (target) void remove(target.id);
  }

  const lastSeenText = (network: HomeNetworkView) =>
    copy.networkLastSeen(network.lastSeenAt ? formatDateTime(new Date(network.lastSeenAt).toISOString()) : null);

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.NETWORKS_TITLE} />
      {blockedMessage ? <StatusMessage tone="info" message={blockedMessage} /> : null}
      {actionError ? <StatusMessage tone="error" message={actionError} /> : null}
      <View style={styles.card}>
        {loading && networks.length === 0 ? (
          <ActivityIndicator style={styles.padded} color={colors.primary} accessibilityLabel="Cargando redes" />
        ) : error && networks.length === 0 ? (
          <View style={[styles.padded, styles.group]}>
            <StatusMessage tone="error" message={error} />
            <SecondaryButton icon="refresh" label="Reintentar" onPress={() => void refresh()} />
          </View>
        ) : networks.length === 0 ? (
          <Text style={[styles.padded, styles.empty]}>{copy.NETWORKS_EMPTY}</Text>
        ) : (
          networks.map((network) => (
            <NetworkRow
              key={network.id}
              name={network.displayName}
              ssid={network.ssid}
              lastSeenText={lastSeenText(network)}
              usageText={copy.networkUsage(network.usedBy)}
              labels={ROW_LABELS}
              editing={editingId === network.id}
              draftName={draftName}
              nameMaxLength={NETWORK_NAME_MAX_LENGTH}
              nameError={nameError}
              saving={saving}
              onChangeDraft={setDraftName}
              onStartRename={() => startRename(network)}
              onSaveRename={() => void saveRename()}
              onCancelRename={() => setEditingId(null)}
              onRemove={() => askRemove(network)}
            />
          ))
        )}
      </View>
      <ConfirmDialog
        visible={pendingDelete !== null}
        message={copy.deleteNetworkMessage(pendingDelete?.displayName ?? '')}
        confirmLabel={copy.DELETE_LABEL}
        cancelLabel={copy.CANCEL_LABEL}
        onConfirm={confirmRemove}
        onCancel={() => setPendingDelete(null)}
        confirmFirst
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
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    padded: {
      padding: spacing.lg,
    },
    group: {
      gap: spacing.md,
    },
    empty: {
      ...typography.body,
      color: colors.textSecondary,
    },
  });
