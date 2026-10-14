import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { ALLOW_LABEL, OPEN_SETTINGS_LABEL, PERMISSION_COPY } from './permission.copy';
import type { PermissionKind } from './permission.types';
import { PermissionStatus } from './PermissionStatus';
import { usePermission } from './usePermission';

/**
 * Un permiso en Ajustes (11-2): estado y, si falta, la misma acción que P02
 * ("Permitir", o "Abrir ajustes" si el sistema ya no deja preguntar).
 */
export function PermissionRow({ kind }: { kind: PermissionKind }) {
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { state, requesting, request } = usePermission(kind);
  const { title, icon } = PERMISSION_COPY[kind];
  const blocked = state !== null && !state.granted && !state.canAskAgain;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Ionicons name={icon} size={iconSizes.lg} color={colors.primary} />
        <View style={styles.texts}>
          <Text style={styles.title}>{title}</Text>
          <PermissionStatus state={state} />
        </View>
      </View>
      {state && !state.granted ? (
        blocked ? (
          <SecondaryButton icon="settings-outline" label={OPEN_SETTINGS_LABEL} onPress={() => void Linking.openSettings()} />
        ) : (
          <SecondaryButton label={ALLOW_LABEL} onPress={request} disabled={requesting} />
        )
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    row: {
      gap: spacing.md,
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    texts: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
  });
