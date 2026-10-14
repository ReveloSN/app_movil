import { StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/atoms/SectionLabel';
import { PermissionRow } from '@/features/permissions/PermissionRow';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { PERMISSIONS_SECTION_TITLE } from './settings.copy';

/** Permisos (11-2): mismos estados y acciones que P02. */
export function PermissionsSection() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.section}>
      <SectionLabel label={PERMISSIONS_SECTION_TITLE} />
      <View style={styles.card}>
        <PermissionRow kind="notifications" />
        <View style={styles.divider} />
        <PermissionRow kind="location" />
      </View>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing }: AppTheme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    card: {
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
