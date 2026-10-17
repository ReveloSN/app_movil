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
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

/** P11. Bloques en el orden del documento de jerarquía (11-1 … 11-6); nombre y cuenta van al final. */
export default function SettingsScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <HomeNetworksSection />
      <PermissionsSection />
      <NotificationPrefsSection />
      <AiSettingsSection />

      {/* 11-6 */}
      <SecondaryButton icon="help-circle-outline" label={HELP_LABEL} onPress={() => router.push('/help')} />

      <SyncStatusSection />

      <ProfileSection />
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
