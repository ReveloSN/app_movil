import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/atoms/PrimaryButton';
import { SecondaryButton } from '@/components/atoms/SecondaryButton';
import { SectionLabel } from '@/components/atoms/SectionLabel';
import { StatusMessage } from '@/components/atoms/StatusMessage';
import { TextButton } from '@/components/atoms/TextButton';
import { TextField } from '@/components/atoms/TextField';
import { ListActionRow } from '@/components/molecules/ListActionRow';
import { SwitchRow } from '@/components/molecules/SwitchRow';
import { BottomSheet } from '@/components/organisms/BottomSheet';
import type { AppTheme } from '@/shared/theme/useAppTheme';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';

import { useCitySearch } from './useCitySearch';
import type { City } from './weather.client';
import * as copy from './weather.copy';
import { updateWeatherPrefs, useWeatherPrefs } from './weather.prefs';

/** Ajustes · Clima: ciudad (búsqueda por nombre), interruptor y atribución de Open-Meteo. */
export function WeatherSettingsSection() {
  const styles = useThemedStyles(createStyles);
  const prefs = useWeatherPrefs();
  const search = useCitySearch();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(false);
  const [askingConsent, setAskingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const choosing = editing || prefs.city === null;

  const save = (changes: Parameters<typeof updateWeatherPrefs>[0]) => {
    setError(null);
    return updateWeatherPrefs(changes).catch((cause: unknown) => {
      if (__DEV__) console.warn('[weather.prefs]', cause);
      setError(copy.SAVE_ERROR);
    });
  };

  // La primera vez se explica qué se envía antes de consultar a Open-Meteo.
  function runSearch() {
    if (!prefs.consented) setAskingConsent(true);
    else void search.search(query);
  }

  async function choose(city: City) {
    await save({ city, enabled: true });
    setEditing(false);
    setQuery('');
    search.clear();
  }

  return (
    <View style={styles.section}>
      <SectionLabel label={copy.WEATHER_SECTION_TITLE} />
      {error ? <StatusMessage tone="error" message={error} /> : null}
      <View style={styles.card}>
        {choosing ? (
          <>
            <TextField
              icon="location-outline"
              label={copy.CITY_FIELD}
              placeholder={copy.CITY_PLACEHOLDER}
              value={query}
              onChangeText={setQuery}
              maxLength={60}
              returnKeyType="search"
              onSubmitEditing={runSearch}
            />
            <SecondaryButton icon="search-outline" label={copy.SEARCH_LABEL} onPress={runSearch} disabled={search.searching || query.trim().length < 2} />
            {search.message ? <StatusMessage tone={search.results.length === 0 && search.message === copy.NO_CITIES ? 'info' : 'error'} message={search.message} /> : null}
            {search.results.map((city) => (
              <ListActionRow key={city.id} label={copy.useCityLabel(copy.cityLabel(city))} onPress={() => void choose(city)} />
            ))}
          </>
        ) : (
          <View style={styles.cityRow}>
            <Text style={styles.city}>{prefs.city ? copy.cityLabel(prefs.city) : ''}</Text>
            <TextButton label={copy.CHANGE_CITY_LABEL} onPress={() => setEditing(true)} />
          </View>
        )}
        <SwitchRow
          icon="umbrella-outline"
          label={copy.WEATHER_SWITCH}
          value={prefs.enabled}
          onValueChange={(enabled) => void save({ enabled })}
          disabled={prefs.city === null}
        />
        <Text style={styles.hint}>{prefs.city === null ? copy.WEATHER_HINT_NO_CITY : copy.WEATHER_HINT}</Text>
        <Text style={styles.hint}>{copy.WEATHER_ATTRIBUTION}</Text>
      </View>
      {askingConsent ? (
        <BottomSheet onRequestClose={() => setAskingConsent(false)}>
          <View style={styles.consent}>
            <Text style={styles.consentTitle} accessibilityRole="header">
              {copy.CONSENT_TITLE}
            </Text>
            <Text style={styles.body}>{copy.CONSENT_TEXT}</Text>
            <PrimaryButton
              label={copy.CONSENT_ACCEPT}
              onPress={() => {
                setAskingConsent(false);
                void save({ consented: true }).then(() => search.search(query));
              }}
            />
            <TextButton label={copy.CONSENT_DECLINE} onPress={() => setAskingConsent(false)} />
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radii, spacing, typography }: AppTheme) =>
  StyleSheet.create({
    section: {
      gap: spacing.sm,
    },
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radii.xxl,
      backgroundColor: colors.card,
    },
    cityRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    city: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flexShrink: 1,
    },
    hint: {
      ...typography.label,
      color: colors.textSecondary,
    },
    consent: {
      gap: spacing.lg,
      padding: spacing.xl,
      paddingBottom: spacing.xxl,
    },
    consentTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    body: {
      ...typography.body,
      color: colors.textPrimary,
    },
  });
