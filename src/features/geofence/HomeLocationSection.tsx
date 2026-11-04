import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { SegmentedControl } from '@/components/molecules/SegmentedControl';
import { useAuth } from '@/features/auth/AuthProvider';
import { useToast } from '@/features/feedback/toast.context';
import { requestPermission } from '@/features/permissions/permission.service';
import { useAppTheme, type AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import * as copy from './geofence.copy';
import { readGeofenceStatus } from './geofence.service';
import { HOME_RADII_METERS, type GeofenceStatus } from './geofence.types';
import { locateHome } from './homeLocation.service';
import { useHomeGeofence } from './useHomeGeofence';

const RADIUS_OPTIONS = HOME_RADII_METERS.map((meters) => ({ value: String(meters), label: copy.radiusOptionLabel(meters) }));
const DEFAULT_RADIUS = 250;

const STATUS_ICON: Record<GeofenceStatus, 'home-outline' | 'checkmark-circle' | 'alert-circle' | 'pause-circle'> = {
  'no-home': 'home-outline',
  'no-arrival': 'pause-circle',
  active: 'checkmark-circle',
  'no-permission': 'alert-circle',
  inactive: 'pause-circle',
};

const openLocationPermission = () => router.push({ pathname: '/routine/permissions', params: { kind: 'location' } });

/**
 * «Casa» en Ajustes: la persona define su casa con su ubicación actual (sin mapas), elige el radio y ve si la
 * detección está activa. Todo se queda en el teléfono.
 */
export function HomeLocationSection() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { colors, iconSizes } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const toast = useToast();
  const { home, loading, save, remove } = useHomeGeofence();
  const [status, setStatus] = useState<GeofenceStatus>('no-home');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(() => {
    if (!userId) return;
    void readGeofenceStatus(userId).then(setStatus);
  }, [userId]);

  // El permiso pudo cambiar en los ajustes del sistema: se vuelve a leer al volver a la pantalla o a la app.
  useFocusEffect(
    useCallback(() => {
      refreshStatus();
    }, [refreshStatus]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && refreshStatus());
    return () => subscription.remove();
  }, [refreshStatus]);
  // Casa guardada o quitada: el estado se vuelve a leer.
  useEffect(() => {
    refreshStatus();
  }, [home, refreshStatus]);

  async function locateAndSave() {
    setError(null);
    setLocating(true);
    try {
      // Pide el permiso de «mientras se usa» aquí mismo; el de «todo el tiempo» se explica en su pantalla.
      const foreground = await requestPermission('location');
      if (!foreground.granted) {
        setError(copy.LOCATION_PERMISSION_NEEDED);
        return;
      }
      const result = await locateHome(home?.radius ?? DEFAULT_RADIUS);
      if (result.status === 'no-permission') setError(copy.LOCATION_PERMISSION_NEEDED);
      else if (result.status === 'unavailable') setError(copy.LOCATION_UNAVAILABLE);
      else {
        setStatus(await save(result.home));
        toast.show({ message: copy.HOME_SAVED, tone: 'info' });
      }
    } catch {
      setError(copy.SAVE_FAILED);
    } finally {
      setLocating(false);
    }
  }

  async function changeRadius(value: string) {
    if (!home) return;
    setError(null);
    try {
      setStatus(await save({ ...home, radius: Number(value) }));
    } catch {
      setError(copy.SAVE_FAILED);
    }
  }

  async function removeHome() {
    setError(null);
    try {
      await remove();
      setStatus('no-home');
      toast.show({ message: copy.HOME_REMOVED, tone: 'info' });
    } catch {
      setError(copy.SAVE_FAILED);
    }
  }

  if (!userId || loading) return null;
  const current: GeofenceStatus = home ? status : 'no-home';

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.HOME_SECTION_TITLE} />
      <View style={styles.card}>
        <Text style={styles.body}>{copy.HOME_INTRO}</Text>

        <View
          style={styles.statusRow}
          accessible
          accessibilityLabel={`${copy.STATUS_TITLE[current]}. ${copy.STATUS_DETAIL[current]}`}
          accessibilityLiveRegion="polite"
        >
          <Ionicons
            name={STATUS_ICON[current]}
            size={iconSizes.lg}
            color={current === 'active' ? colors.primary : current === 'no-home' ? colors.textMuted : colors.danger}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{copy.STATUS_TITLE[current]}</Text>
            <Text style={styles.detail}>{copy.STATUS_DETAIL[current]}</Text>
          </View>
        </View>

        {current === 'no-permission' ? (
          <SecondaryButton icon="location-outline" label={copy.ALLOW_BACKGROUND_LABEL} onPress={openLocationPermission} />
        ) : null}

        {home ? (
          <View style={styles.radius}>
            <Text style={styles.statusTitle}>{copy.RADIUS_LABEL}</Text>
            <SegmentedControl
              accessibilityLabel={copy.RADIUS_LABEL}
              options={RADIUS_OPTIONS}
              value={String(home.radius)}
              onChange={(value) => void changeRadius(value)}
            />
            <Text style={styles.detail}>{copy.RADIUS_HINT}</Text>
          </View>
        ) : null}

        {error ? <StatusMessage tone="error" message={error} /> : null}

        <SecondaryButton
          icon="locate-outline"
          label={locating ? copy.LOCATING_LABEL : copy.USE_LOCATION_LABEL}
          onPress={() => void locateAndSave()}
          disabled={locating}
        />
        {home ? (
          <View style={styles.remove}>
            <TextButton label={copy.REMOVE_HOME_LABEL} tone="danger" onPress={() => void removeHome()} disabled={locating} />
          </View>
        ) : null}

        <Text style={styles.detail}>{copy.DETECTION_DELAY_NOTE}</Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    card: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    statusText: {
      flex: 1,
      gap: spacing.xs,
    },
    statusTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    detail: {
      ...typography.label,
      color: colors.textSecondary,
    },
    radius: {
      gap: spacing.sm,
    },
    remove: {
      alignItems: 'center',
    },
  });
