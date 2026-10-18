import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

interface TabSwipeLockValue {
  /** true mientras algún gesto horizontal propio (ej. chips con scroll) está en marcha. */
  locked: boolean;
  lock(): void;
  unlock(): void;
}

const TabSwipeLockContext = createContext<TabSwipeLockValue>({ locked: false, lock: () => undefined, unlock: () => undefined });

/** Permite a una pantalla de las pestañas pausar el deslizamiento entre pestañas durante su propio gesto. */
export function TabSwipeLockProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);
  const lock = useCallback(() => setLocked(true), []);
  const unlock = useCallback(() => setLocked(false), []);
  const value = useMemo(() => ({ locked, lock, unlock }), [locked, lock, unlock]);
  return <TabSwipeLockContext.Provider value={value}>{children}</TabSwipeLockContext.Provider>;
}

export const useTabSwipeLock = () => use(TabSwipeLockContext);

/** Props para el contenedor de un gesto horizontal propio: bloquea el deslizamiento de pestañas al tocarlo. */
export function useTabSwipeLockHandlers() {
  const { lock, unlock } = useTabSwipeLock();
  return { onTouchStart: lock, onTouchEnd: unlock, onTouchCancel: unlock };
}
