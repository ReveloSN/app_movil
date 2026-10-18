import { useEffect, useState } from 'react';

import { useWeatherPrefs } from './weather.prefs';
import type { WeatherRule } from './weather.rules';
import { currentWeatherSuggestion } from './weather.service';

/**
 * Sugerencia del clima para P07, en segundo plano: la verificación se usa desde el primer momento y,
 * si llega una sugerencia (caché o ≤ 4 s), aparece discreta. Sin ciudad, apagada, sin red o con error: nada.
 */
export function useWeatherSuggestion(): { rule: WeatherRule | null; dismiss(): void } {
  const { city, enabled } = useWeatherPrefs();
  const [rule, setRule] = useState<WeatherRule | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!enabled || !city) return;
    let active = true;
    void currentWeatherSuggestion(city).then((found) => {
      if (active) setRule(found);
    });
    return () => {
      active = false;
    };
  }, [city, enabled]);

  return { rule: enabled && city && !dismissed ? rule : null, dismiss: () => setDismissed(true) };
}
