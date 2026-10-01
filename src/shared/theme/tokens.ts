import { ColorSchemeName } from 'react-native';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radii = { xs: 4, sm: 6, md: 9, lg: 12, xl: 14, xxl: 16, full: 9999 } as const;

// Cada fontFamily es el nombre exacto con el que se carga el peso en fonts.ts (fontAssets).
export const typography = {
  display: { fontSize: 82, lineHeight: 92, fontFamily: 'IBMPlexSans_300Light' },
  h1: { fontSize: 28, lineHeight: 34, fontFamily: 'IBMPlexSans_700Bold' },
  h2: { fontSize: 20, lineHeight: 26, fontFamily: 'IBMPlexSans_600SemiBold' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontFamily: 'IBMPlexSans_600SemiBold' },
  body: { fontSize: 16, lineHeight: 22, fontFamily: 'IBMPlexSans_400Regular' },
  labelMedium: { fontSize: 14, lineHeight: 20, fontFamily: 'IBMPlexSans_500Medium' },
  label: { fontSize: 14, lineHeight: 20, fontFamily: 'IBMPlexSans_400Regular' },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: 'IBMPlexSans_500Medium' },
  captionRegular: { fontSize: 12, lineHeight: 16, fontFamily: 'IBMPlexSans_400Regular' },
} as const;

export const sizes = {
  primaryButtonHeight: 52,
  secondaryRowHeight: 44,
  inputHeight: 40,
  badgeHeight: 28,
  progressBarHeight: 6,
  largeIconCircle: 112,
} as const;

// No viene del mockup: escala de íconos para no dejar tamaños sueltos en los componentes.
export const iconSizes = { sm: 16, md: 20, lg: 24, xl: 48 } as const;

const lightColors = {
  background: '#E7EAE5',
  surface: '#F3F5F1',
  card: '#FFFFFF',
  primary: '#0B7A57',
  primaryPressed: '#096546',
  primaryTint: '#DCEFE5',
  onPrimary: '#FFFFFF',
  textPrimary: '#15201B',
  textSecondary: '#6E7B73',
  textMuted: '#4A5850',
  border: '#D5DCD3',
  neutralSurface: '#EDF0EC',
  criticalBg: '#F7E8CF',
  criticalText: '#A8660B',
  danger: '#B3372E',
  categoryGreen: '#0B7A57',
  categoryBlue: '#2F6DA8',
  categoryAmber: '#A8660B',
  categoryPurple: '#7A4B8F',
  categoryGray: '#4A5850',
} as const;

// Valores marcados "estimado" no estaban visibles en las pantallas extraídas del mockup;
// ajústalos si al revisar otras pantallas del diseño aparecen con un valor distinto.
const darkColors = {
  background: '#0E1512',
  surface: '#131C18',
  card: '#1B2A23',
  primary: '#7FD9B4',
  primaryPressed: '#6BC7A2', // estimado
  primaryTint: 'rgba(127,217,180,0.16)', // estimado
  onPrimary: '#0E1512',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.18)',
  neutralSurface: 'rgba(255,255,255,0.08)',
  criticalBg: 'rgba(247,232,207,0.92)',
  criticalText: '#8A5409',
  danger: '#E5534B', // estimado
  categoryGreen: '#7FD9B4',
  categoryBlue: '#6FA8D8', // estimado
  categoryAmber: '#D99A3A', // estimado
  categoryPurple: '#B089C2', // estimado
  categoryGray: 'rgba(255,255,255,0.6)', // estimado
} as const;

export const palettes = { light: lightColors, dark: darkColors };

export function getColors(scheme: ColorSchemeName) {
  return scheme === 'dark' ? palettes.dark : palettes.light;
}
