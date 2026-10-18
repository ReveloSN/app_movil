import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { AccountSection } from '@/features/settings/AccountSection';
import { AiSettingsSection } from '@/features/settings/AiSettingsSection';
import { HomeNetworksSection } from '@/features/settings/HomeNetworksSection';
import { NotificationPrefsSection } from '@/features/settings/NotificationPrefsSection';
import { PermissionsSection } from '@/features/settings/PermissionsSection';
import { ProfileSection } from '@/features/settings/ProfileSection';
import { HELP_LABEL } from '@/features/settings/settings.copy';
import { SyncStatusSection } from '@/features/sync/SyncStatusSection';
import { WeatherSettingsSection } from '@/features/weather/WeatherSettingsSection';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/**
 * P11 en el orden del documento de jerarquía: redes (11-1) → permisos (11-2) → no molestar, posponer y
 * sonido (11-3/4/5) → IA → nombre → cambios sin sincronizar → ayuda (11-6) → cuenta.
 */
export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <HomeNetworksSection />
      <PermissionsSection />
      <NotificationPrefsSection />
      <AiSettingsSection />
      <WeatherSettingsSection />
      <ProfileSection />
      <SyncStatusSection />

      {/* 11-6: la ayuda va hacia el final, antes de la cuenta. */}
      <SecondaryButton icon="help-circle-outline" label={HELP_LABEL} onPress={() => router.push('/help')} />

      {/* "Cerrar sesión" queda al final de la pantalla. */}
      <AccountSection />
    </ScrollView>
  );
}

const createStyles = ({ colors, spacing }: AppTheme) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      gap: spacing.xl,
      padding: spacing.xl,
    },
  });
