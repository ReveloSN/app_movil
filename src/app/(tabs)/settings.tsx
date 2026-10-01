import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors, spacing, typography } from '@/shared/theme/tokens';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
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
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <PrimaryButton label="Cerrar sesión" onPress={handleSignOut} loading={signingOut} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  section: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
  value: {
    ...typography.body,
    color: colors.textPrimary,
  },
});
