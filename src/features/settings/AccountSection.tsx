import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { useThemeMode } from '@/shared/theme/themeMode.context';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import {
  ACCOUNT_SECTION_TITLE,
  accountLabel,
  CANCEL_LABEL,
  GUEST_SIGN_OUT_MESSAGE,
  SIGN_OUT_LABEL,
  SIGNED_IN_AS_LABEL,
} from './settings.copy';

/** Cuenta (al final de P11): quién tiene la sesión, modo oscuro y cerrar sesión. */
export function AccountSection() {
  const { user, signOut } = useAuth();
  const { mode, toggle } = useThemeMode();
  const styles = useThemedStyles(createStyles);
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al cerrar sesión, RequireSession redirige a login al quedar sin usuario.
  async function signOutNow() {
    setConfirming(false);
    setSigningOut(true);
    setError(null);
    const result = await signOut();
    setSigningOut(false);
    setError(result.error);
  }

  // Un invitado no puede volver a entrar a su cuenta: se confirma antes de cerrarla.
  function requestSignOut() {
    if (user?.isAnonymous) setConfirming(true);
    else void signOutNow();
  }

  return (
    <View style={styles.section}>
      <SectionLabel label={ACCOUNT_SECTION_TITLE} />
      <View style={styles.card}>
        <Text style={styles.label}>{SIGNED_IN_AS_LABEL}</Text>
        <Text style={styles.value}>{accountLabel(user)}</Text>
        <SwitchRow icon="contrast-outline" label="Modo oscuro" value={mode === 'dark'} onValueChange={() => toggle()} />
      </View>
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <PrimaryButton label={SIGN_OUT_LABEL} onPress={requestSignOut} loading={signingOut} />
      <ConfirmDialog
        visible={confirming}
        message={GUEST_SIGN_OUT_MESSAGE}
        confirmLabel={SIGN_OUT_LABEL}
        cancelLabel={CANCEL_LABEL}
        onConfirm={() => void signOutNow()}
        onCancel={() => setConfirming(false)}
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
    label: {
      ...typography.labelMedium,
      color: colors.textSecondary,
    },
    value: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
