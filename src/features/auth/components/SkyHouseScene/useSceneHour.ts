import { useCallback, useEffect, useState } from 'react';

import { hourOf, normalizeHour } from './sceneTheme';

const MINUTE_MS = 60_000;
/** Modo demostración: 24 h en ~24 s (0,1 h cada 100 ms). */
const DEMO_STEP_MS = 100;
const DEMO_STEP_HOURS = 0.1;

/** Solo en desarrollo: EXPO_PUBLIC_HERO_HOUR=22 fija la hora de la escena. Fuera de __DEV__ se ignora. */
export function forcedHour(raw: string | undefined, dev: boolean): number | null {
  if (!dev || raw === undefined || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? normalizeHour(value) : null;
}

const FORCED_HOUR = forcedHour(process.env.EXPO_PUBLIC_HERO_HOUR, __DEV__);

export interface SceneHour {
  /** Hora decimal 0–24 que muestra la escena. */
  hour: number;
  /** Recorrido de 24 h en marcha. */
  demo: boolean;
  /** Activa o desactiva el recorrido (al desactivarlo vuelve a la hora real). */
  toggleDemo(): void;
}

/**
 * Hora de la escena: la local del teléfono, que se actualiza al cambiar el minuto (solo con la escena
 * activa). El modo demostración recorre el día en memoria; nunca toca el reloj ni se guarda.
 */
export function useSceneHour(active: boolean): SceneHour {
  const [now, setNow] = useState(() => new Date());
  const [demoHour, setDemoHour] = useState<number | null>(null);
  const demo = demoHour !== null;

  // Reloj real: espera al siguiente minuto exacto y luego avisa cada minuto. Al volver al primer plano, se pone al día.
  useEffect(() => {
    if (!active || demo) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const catchUp = setTimeout(() => setNow(new Date()), 0);
    const first = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), MINUTE_MS);
      },
      MINUTE_MS - (Date.now() % MINUTE_MS),
    );
    return () => {
      clearTimeout(catchUp);
      clearTimeout(first);
      if (interval) clearInterval(interval);
    };
  }, [active, demo]);

  useEffect(() => {
    if (!active || !demo) return;
    const interval = setInterval(
      () => setDemoHour((current) => (current === null ? null : normalizeHour(current + DEMO_STEP_HOURS))),
      DEMO_STEP_MS,
    );
    return () => clearInterval(interval);
  }, [active, demo]);

  const realHour = FORCED_HOUR ?? hourOf(now);
  const toggleDemo = useCallback(() => {
    setDemoHour((current) => (current === null ? realHour : null));
  }, [realHour]);

  return { hour: demoHour ?? realHour, demo, toggleDemo };
}
