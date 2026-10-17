import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import * as copy from '@/features/permissions/permission.copy';
import {
  getBackgroundLocation,
  isLocationServiceEnabled,
  requestBackgroundLocation,
} from '@/features/permissions/permission.service';
import { isPermissionKind } from '@/features/permissions/permission.types';
import { PermissionStatus } from '@/features/permissions/PermissionStatus';
import { usePermission } from '@/features/permissions/usePermission';
import { useScrollEndPadding } from '@/shared/hooks/useScrollEndPadding';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

const backgroundLocationService = { get: getBackgroundLocation, request: requestBackgroundLocation };

function openSettings() {
  void Linking.openSettings();
}

/** Volver a quien pidió el permiso (P06), que retoma lo que se había llenado. */
function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/(tabs)');
}

/** P02. Se reutiliza para notificaciones y ubicación según `?kind=`. */
export default function PermissionsScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind = isPermissionKind(params.kind) ? params.kind : 'notifications';
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const endPadding = useScrollEndPadding();
  const { state, requesting, request } = usePermission(kind);
  const background = usePermission(kind, backgroundLocationService);
  const [servicesOff, setServicesOff] = useState(false);
  const { title, icon, reason } = copy.PERMISSION_COPY[kind];

  const granted = state?.granted ?? false;
  const blocked = state !== null && !state.granted && !state.canAskAgain;
  const showBackground = kind === 'location' && granted && Platform.OS === 'android';

  useEffect(() => {
    if (kind !== 'location' || !granted) return;
    isLocationServiceEnabled().then(
      (enabled) => setServicesOff(!enabled),
      () => undefined,
    );
  }, [kind, granted]);

  return (
    <ScrollView contentContainerStyle={[styles.content, endPadding]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={iconSizes.xl} color={colors.primary} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.reason}>{reason}</Text>
      <PermissionStatus state={state} />

      {servicesOff ? <StatusMessage tone="info" message={copy.LOCATION_SERVICES_OFF} /> : null}

      {granted ? (
        <PrimaryButton label={copy.CONTINUE_LABEL} onPress={goBack} />
      ) : blocked ? (
        <PrimaryButton label={copy.OPEN_SETTINGS_LABEL} onPress={openSettings} />
      ) : (
        <PrimaryButton label={copy.ALLOW_LABEL} onPress={request} loading={requesting} disabled={state === null} />
      )}

      {showBackground ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle} accessibilityRole="header">
            {copy.BACKGROUND_LOCATION_TITLE}
          </Text>
          <Text style={styles.reason}>{copy.BACKGROUND_LOCATION_REASON}</Text>
          <PermissionStatus state={background.state} />
          {background.state?.granted ? null : background.state && !background.state.canAskAgain ? (
            <SecondaryButton icon="settings-outline" label={copy.OPEN_SETTINGS_LABEL} onPress={openSettings} />
          ) : (
            <SecondaryButton
              icon="location-outline"
              label={copy.BACKGROUND_LOCATION_ALLOW}
              onPress={background.request}
              disabled={background.requesting || background.state === null}
            />
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const createStyles = ({ colors, radii, sizes, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      gap: spacing.lg,
      padding: spacing.xl,
    },
    iconCircle: {
      alignSelf: 'center',
      width: sizes.largeIconCircle,
      height: sizes.largeIconCircle,
      borderRadius: radii.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryTint,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    reason: {
      ...typography.body,
      color: colors.textPrimary,
    },
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    cardTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
  });
