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
  /** Fila de la verificación (P07): área táctil de 56pt. */
  checklistRowHeight: 56,
  /** Alto de la barra de pestañas de React Navigation (sin el inset inferior). */
  tabBarHeight: 49,
} as const;

// No viene del mockup: escala de íconos para no dejar tamaños sueltos en los componentes.
export const iconSizes = { sm: 16, md: 20, lg: 24, xl: 48 } as const;

// Paleta provisional (2026-10-17): parte del mockup con una pasada de color ligera y contrastes
// corregidos (texto ≥ 4,5:1 sobre fondo, superficie, tarjeta y tintes). Una paleta completa la
// reemplazará: las pantallas solo usan estos nombres, nunca valores sueltos.
const lightColors = {
  /** Verde grisáceo muy suave (antes #E7EAE5). */
  background: '#E5EBE5',
  surface: '#F2F6F1',
  card: '#FFFFFF',
  /** Algo más oscuro que el #0B7A57 del mockup: como texto no llegaba a 4,5:1 sobre el fondo. */
  primary: '#096B4C',
  primaryPressed: '#075A40',
  primaryTint: '#DDF0E6',
  onPrimary: '#FFFFFF',
  /** Tarjetas destacadas (ej. "Próxima rutina"). */
  accentSurface: '#EEF7F1',
  textPrimary: '#15201B',
  /** Antes #6E7B73 (3,65:1 sobre el fondo). */
  textSecondary: '#58665E',
  textMuted: '#4A5850',
  border: '#D5DCD3',
  neutralSurface: '#EBEFEA',
  criticalBg: '#F7E8CF',
  /** Antes #A8660B (3,8:1 sobre criticalBg). */
  criticalText: '#8A5409',
  danger: '#B3372E',
  // Color de cada rutina (04-2) y su tinte para fondos de ícono y franjas.
  categoryGreen: '#096B4C',
  categoryGreenTint: '#DDF0E6',
  categoryBlue: '#2B629A',
  categoryBlueTint: '#DFE9F4',
  categoryAmber: '#A8660B',
  categoryAmberTint: '#F7E8CF',
  categoryPurple: '#7A4B8F',
  categoryPurpleTint: '#EEE4F3',
  categoryGray: '#4A5850',
  categoryGrayTint: '#E6EAE5',
  /** No viene del mockup: fondo oscurecido detrás de los diálogos. */
  scrim: 'rgba(21,32,27,0.5)',
  // No vienen del mockup: aviso breve (snackbar) en contraste con la pantalla.
  inverseSurface: '#15201B',
  onInverseSurface: '#FFFFFF',
  inversePrimary: '#7FD9B4',
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
  accentSurface: '#16261F', // no viene del mockup
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.7)',
  textMuted: 'rgba(255,255,255,0.55)',
  border: 'rgba(255,255,255,0.18)',
  neutralSurface: 'rgba(255,255,255,0.08)',
  /** Opaco (antes al 92 %): con transparencia, criticalText quedaba en 4,4:1. */
  criticalBg: '#F7E8CF',
  criticalText: '#8A5409',
  /** Antes #E5534B (4,0:1 sobre la tarjeta). */
  danger: '#F07A72',
  categoryGreen: '#7FD9B4',
  categoryGreenTint: 'rgba(127,217,180,0.18)',
  categoryBlue: '#6FA8D8', // estimado
  categoryBlueTint: 'rgba(111,168,216,0.18)',
  categoryAmber: '#D99A3A', // estimado
  categoryAmberTint: 'rgba(217,154,58,0.18)',
  categoryPurple: '#B089C2', // estimado
  categoryPurpleTint: 'rgba(176,137,194,0.18)',
  categoryGray: 'rgba(255,255,255,0.6)', // estimado
  categoryGrayTint: 'rgba(255,255,255,0.1)',
  scrim: 'rgba(0,0,0,0.6)', // no viene del mockup
  inverseSurface: '#E7EAE5', // no viene del mockup
  onInverseSurface: '#15201B',
  inversePrimary: '#096546',
} as const;

export const palettes = { light: lightColors, dark: darkColors };

export function getColors(scheme: ColorSchemeName) {
  return scheme === 'dark' ? palettes.dark : palettes.light;
}
