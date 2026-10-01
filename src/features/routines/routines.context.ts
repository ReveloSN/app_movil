import { createContext } from 'react';

import type { RoutinesContextValue } from './routines.types';

export const RoutinesContext = createContext<RoutinesContextValue | null>(null);
