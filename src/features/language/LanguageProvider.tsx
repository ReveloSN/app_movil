import { useEffect, useState, type ReactNode } from 'react';

import { loadLocale } from '@/shared/i18n/locale.store';
import type { KeyValueStorage } from '@/shared/types/key-value-storage.types';

interface LanguageProviderProps {
  children: ReactNode;
  /** Inyectable para tests; por defecto AsyncStorage. */
  storage?: KeyValueStorage;
}

/** No pinta nada hasta conocer el idioma guardado: así la primera pantalla ya sale en el idioma elegido. */
export function LanguageProvider({ children, storage }: LanguageProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadLocale(storage).finally(() => {
      if (mounted) setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, [storage]);

  return ready ? <>{children}</> : null;
}
