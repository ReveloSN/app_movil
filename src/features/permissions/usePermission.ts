import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getPermission, requestPermission } from './permission.service';
import type { PermissionKind, PermissionState } from './permission.types';

interface PermissionService {
  get(kind: PermissionKind): Promise<PermissionState>;
  request(kind: PermissionKind): Promise<PermissionState>;
}

const defaultService: PermissionService = { get: getPermission, request: requestPermission };

/**
 * Estado de un permiso. Se vuelve a leer al regresar a la app: la persona pudo cambiarlo
 * en los ajustes del sistema.
 */
export function usePermission(kind: PermissionKind, service: PermissionService = defaultService) {
  const [state, setState] = useState<PermissionState | null>(null);
  const [requesting, setRequesting] = useState(false);
  const latest = useRef(0);

  const refresh = useCallback((): Promise<void> => {
    const request = ++latest.current;
    return service.get(kind).then(
      (next) => {
        if (request === latest.current) setState(next);
      },
      (cause: unknown) => {
        if (__DEV__) console.warn('[permissions.get]', cause);
      },
    );
  }, [kind, service]);

  useEffect(() => {
    void refresh();
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const request = useCallback(async () => {
    setRequesting(true);
    try {
      latest.current += 1; // Lo que pida el diálogo manda sobre una lectura en curso.
      setState(await service.request(kind));
    } catch (cause) {
      if (__DEV__) console.warn('[permissions.request]', cause);
    } finally {
      setRequesting(false);
    }
  }, [kind, service]);

  return { state, requesting, request, refresh };
}
