// Contraste WCAG entre dos colores del tema. Acepta #RRGGBB y rgba(r,g,b,a) (este último se mezcla
// sobre el fondo). Lo usan las pruebas de la paleta: cambiarla no puede bajar el contraste.

type Rgb = [number, number, number];

function parse(color: string): { rgb: Rgb; alpha: number } {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const value = hex[1];
    return { rgb: [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb, alpha: 1 };
  }
  const rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(color);
  if (rgba) return { rgb: [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])], alpha: Number(rgba[4]) };
  throw new Error(`Color no soportado: ${color}`);
}

/** Color opaco resultante de pintar `color` sobre `background` (opaco). */
function flatten(color: string, background: Rgb): Rgb {
  const { rgb, alpha } = parse(color);
  return rgb.map((channel, i) => channel * alpha + background[i] * (1 - alpha)) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Relación de contraste de `foreground` sobre `background`; `base` es lo que hay debajo si el fondo es translúcido. */
export function contrastRatio(foreground: string, background: string, base = '#000000'): number {
  const bg = flatten(background, parse(base).rgb);
  const fg = flatten(foreground, bg);
  const [light, dark] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
