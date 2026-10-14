import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { LOCATION_SERVICES_OFF, PERMISSION_COPY } from '@/features/permissions/permission.copy';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './trigger.copy';
import type { WifiDetection } from './wifi/useCurrentWifi';

interface NetworkDetectionProps {
  detection: WifiDetection;
  onDetect(): void;
  /** Lleva a P02 (ubicación). */
  onRequestPermission(): void;
  /** Usar la red detectada como red del aviso. */
  onUse(ssid: string): void;
}

/** Red detectada (06-4): sugiere el Wi-Fi actual o explica por qué no se puede leer. */
export function NetworkDetection({ detection, onDetect, onRequestPermission, onUse }: NetworkDetectionProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  switch (detection.status) {
    case 'idle':
    case 'detecting':
      return (
        <View style={styles.row} accessible accessibilityLabel="Detectando la red" accessibilityState={{ busy: true }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.text}>Detectando la red…</Text>
        </View>
      );
    case 'detected':
      return (
        <View style={styles.group}>
          <StatusMessage tone="info" message={copy.detectedNetworkMessage(detection.ssid)} />
          <SecondaryButton icon="wifi" label={copy.applyNetworkLabel(detection.ssid)} onPress={() => onUse(detection.ssid)} />
        </View>
      );
    case 'needs-permission':
      return (
        <View style={styles.group}>
          <StatusMessage tone="info" message={PERMISSION_COPY.location.reason} />
          <SecondaryButton icon="location-outline" label={copy.DETECT_NETWORK_LABEL} onPress={onRequestPermission} />
        </View>
      );
    default: {
      const message =
        detection.status === 'services-off'
          ? LOCATION_SERVICES_OFF
          : detection.status === 'not-on-wifi'
            ? copy.NOT_ON_WIFI_MESSAGE
            : copy.HIDDEN_SSID_MESSAGE;
      return (
        <View style={styles.group}>
          <StatusMessage tone="info" message={message} />
          <SecondaryButton icon="refresh" label={copy.DETECT_NETWORK_LABEL} onPress={onDetect} />
        </View>
      );
    }
  }
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    group: {
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    text: {
      ...typography.label,
      color: colors.textSecondary,
    },
  });
