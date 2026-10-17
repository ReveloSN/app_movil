import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog';
import { getLocalStore } from '@/db/local/local.store';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSync } from '@/features/sync/SyncProvider';
import { useThemeMode } from '@/shared/theme/themeMode.context';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import {
  ACCOUNT_SECTION_TITLE,
  accountLabel,
  CANCEL_LABEL,
  SIGN_OUT_LABEL,
  SIGNED_IN_AS_LABEL,
  signOutWarning,
} from './settings.copy';

/** Cuenta (al final de P11): quién tiene la sesión, modo oscuro y cerrar sesión. */
export function AccountSection() {
  const { user, signOut } = useAuth();
  const { pendingCount, failedChanges } = useSync();
  const { mode, toggle } = useThemeMode();
  const styles = useThemedStyles(createStyles);
  const [warning, setWarning] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Al cerrar sesión, RequireSession redirige a login al quedar sin usuario.
  async function signOutNow() {
    // Un invitado no puede volver a entrar: su copia local ya no le sirve a nadie (ya se le advirtió).
    const guestId = user?.isAnonymous ? user.id : null;
    setWarning(null);
    setSigningOut(true);
    setError(null);
    const result = await signOut();
    if (!result.error && guestId) {
      await getLocalStore(guestId)
        .clear()
        .catch((cause: unknown) => {
          if (__DEV__) console.warn('[account.clearGuestData]', cause);
        });
    }
    setSigningOut(false);
    setError(result.error);
  }

  // Se confirma si hay algo que avisar: un invitado no puede volver a entrar, o quedan cambios sin subir.
  function requestSignOut() {
    const message = signOutWarning(user, pendingCount + failedChanges.length);
    if (message) setWarning(message);
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
        visible={warning !== null}
        message={warning ?? ''}
        confirmLabel={SIGN_OUT_LABEL}
        cancelLabel={CANCEL_LABEL}
        onConfirm={() => void signOutNow()}
        onCancel={() => setWarning(null)}
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
