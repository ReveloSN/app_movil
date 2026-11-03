import { useCallback, useEffect, useState } from 'react';

import { loadViewModePreference, saveViewModePreference, type ViewMode } from './checklist.viewmode';

/** La forma de verificar elegida en Ajustes en este teléfono; `null` mientras se lee. */
export function useViewModePreference() {
  const [preferred, setPreferred] = useState<ViewMode | null>(null);

  useEffect(() => {
    let active = true;
    void loadViewModePreference().then((mode) => {
      if (active) setPreferred(mode);
    });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback((mode: ViewMode) => {
    setPreferred(mode);
    saveViewModePreference(mode).catch((cause: unknown) => {
      if (__DEV__) console.warn('[viewmode.save]', cause);
    });
  }, []);

  return { preferred, save };
}
