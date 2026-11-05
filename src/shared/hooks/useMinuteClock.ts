import { useEffect, useMemo, useState } from 'react';

const MINUTE_MS = 60_000;
const minuteOf = () => Math.floor(Date.now() / MINUTE_MS);

/**
 * "Ahora" estable: cambia una vez por minuto, no en cada render. Así lo que depende de la fecha no se
 * recalcula mientras se escribe, se desplaza o se anima, pero el día siguiente se detecta en menos de un minuto.
 */
export function useMinuteClock(): Date {
  const [minute, setMinute] = useState(minuteOf);
  useEffect(() => {
    const timer = setInterval(() => setMinute(minuteOf()), MINUTE_MS);
    return () => clearInterval(timer);
  }, []);
  return useMemo(() => new Date(minute * MINUTE_MS), [minute]);
}
