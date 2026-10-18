import { useEffect } from 'react';

import { InsightCard } from '@/components/molecules/InsightCard';
import type { ChecklistItemState } from '@/features/checklist/checklist.types';
import { hapticToggleOn } from '@/shared/haptics/haptics';

import { useWeatherSuggestion } from './useWeatherSuggestion';
import * as copy from './weather.copy';
import { useWeatherPrefs } from './weather.prefs';
import { prefetchWeather } from './weather.service';

type TemporaryItem = Pick<ChecklistItemState, 'id' | 'label' | 'icon' | 'origin'>;

/**
 * P07: "Hoy puede llover. ¿Añadimos «Paraguas»?" [Añadir solo hoy] [No]. Discreta y opcional: si no llega
 * a tiempo, simplemente no aparece. "Solo hoy" no toca la rutina: el ítem queda en esta verificación.
 */
export function WeatherHint({ onAdd }: { onAdd(item: TemporaryItem): void }) {
  const { rule, dismiss } = useWeatherSuggestion();
  if (!rule) return null;

  return (
    <InsightCard
      icon={rule.item.icon}
      message={rule.message}
      acceptLabel={copy.ADD_TODAY}
      dismissLabel={copy.NO_THANKS}
      onAccept={() => {
        onAdd({ id: `weather-${rule.id}`, label: rule.item.label, icon: rule.item.icon, origin: 'weather' });
        hapticToggleOn();
        dismiss();
      }}
      onDismiss={dismiss}
    />
  );
}

/** Al abrir la app (Inicio), deja el clima en caché para que P07 no tenga que esperar. */
export function usePrefetchWeather() {
  const { city, enabled } = useWeatherPrefs();
  useEffect(() => {
    void prefetchWeather(city, enabled);
  }, [city, enabled]);
}
