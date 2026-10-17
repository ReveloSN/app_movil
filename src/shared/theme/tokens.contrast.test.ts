import { contrastRatio } from './contrast';
import { palettes } from './tokens';

type Palette = (typeof palettes)['light'] | (typeof palettes)['dark'];
type Key = keyof Palette;

const TEXT_MIN = 4.5;
// Superficies sobre las que va texto normal.
const SURFACES: Key[] = ['background', 'surface', 'card', 'neutralSurface', 'accentSurface', 'primaryTint'];
const TEXTS: Key[] = ['textPrimary', 'textSecondary', 'textMuted', 'primary', 'danger'];

describe.each(['light', 'dark'] as const)('contraste de la paleta (%s)', (mode) => {
  const colors: Palette = palettes[mode];
  // Lo translúcido se pinta sobre el fondo de la pantalla.
  const ratio = (fg: Key, bg: Key) => contrastRatio(colors[fg], colors[bg], colors.background);

  it.each(TEXTS.flatMap((text) => SURFACES.map((surface) => [text, surface] as const)))(
    '%s sobre %s ≥ 4,5:1',
    (text, surface) => {
      expect(ratio(text, surface)).toBeGreaterThanOrEqual(TEXT_MIN);
    },
  );

  it('la marca de crítico se lee sobre su fondo', () => {
    expect(ratio('criticalText', 'criticalBg')).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it('el texto sobre el botón principal y sobre el aviso breve se lee', () => {
    expect(ratio('onPrimary', 'primary')).toBeGreaterThanOrEqual(TEXT_MIN);
    expect(ratio('onInverseSurface', 'inverseSurface')).toBeGreaterThanOrEqual(TEXT_MIN);
    expect(ratio('inversePrimary', 'inverseSurface')).toBeGreaterThanOrEqual(TEXT_MIN);
  });

  it.each(['Green', 'Blue', 'Amber', 'Purple', 'Gray'] as const)('el ícono de una rutina %s se distingue de su tinte (≥ 3:1)', (name) => {
    const color = `category${name}` as Key;
    const tint = `category${name}Tint` as Key;
    expect(contrastRatio(colors[color], colors[tint], colors.card)).toBeGreaterThanOrEqual(3);
  });
});
