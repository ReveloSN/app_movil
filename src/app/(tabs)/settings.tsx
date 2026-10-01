import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { useAuth } from '@/features/auth/AuthProvider';
import { useThemeMode } from '@/shared/theme/themeMode.context';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const { mode, toggle } = useThemeMode();
  const styles = useThemedStyles(createStyles);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al cerrar sesión, (tabs)/_layout redirige a login al detectar session === null.
  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    const result = await signOut();
    setSigningOut(false);
    setError(result.error);
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Sesión iniciada como</Text>
        <Text style={styles.value}>{session?.user.email ?? '—'}</Text>
      </View>
      <View style={styles.section}>
        <SwitchRow icon="moon-outline" label="Modo oscuro" value={mode === 'dark'} onValueChange={() => toggle()} />
      </View>
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <PrimaryButton label="Cerrar sesión" onPress={handleSignOut} loading={signingOut} />
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      gap: spacing.lg,
      padding: spacing.xl,
      backgroundColor: colors.background,
    },
    section: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    label: {
      ...typography.labelMedium,
      color: colors.textSecondary,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
