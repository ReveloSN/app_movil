// Design tokens. Valores provisionales: reemplazar por los del Design System (Documento 4).

export const colors = {
  primary: '#1F5FBF',
  onPrimary: '#FFFFFF',
  primaryDisabled: '#9DB5DA',
  background: '#FFFFFF',
  surface: '#F4F6F9',
  textPrimary: '#1A1D21',
  textSecondary: '#5A6270',
  border: '#C9CFD8',
  borderFocus: '#1F5FBF',
  error: '#B3261E',
  tabInactive: '#5A6270',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '400' },
  label: { fontSize: 14, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '400' },
  button: { fontSize: 16, fontWeight: '600' },
} as const;

/** Altura mínima de cualquier elemento táctil (regla de 56pt). */
export const touchTarget = 56;
