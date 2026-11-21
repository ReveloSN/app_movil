import { resetLocaleForTests, setLocale } from './locale.store';
import { memoryStorage } from '@/db/local/testing/memoryStorage';

// La prueba recorre el árbol de archivos; el proyecto no trae los tipos de Node, así que se declara solo lo que se usa.
declare const __dirname: string;
interface DirEntry {
  name: string;
  isDirectory(): boolean;
}
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as {
  readdirSync(dir: string, options: { withFileTypes: true }): DirEntry[];
  readFileSync(file: string, encoding: 'utf8'): string;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path') as {
  sep: string;
  resolve(...parts: string[]): string;
  join(...parts: string[]): string;
  relative(from: string, to: string): string;
};

const SRC = path.resolve(__dirname, '../..');

/** Módulos que exportan `export default localized(`. */
function localizedModules(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) localizedModules(full, found);
    else if (/\.ts$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) && fs.readFileSync(full, 'utf8').includes('export default localized(')) found.push(full);
  }
  return found;
}

/** Textos (cadenas) de un objeto, con su ruta. Las funciones se prueban aparte. */
function strings(value: unknown, trail = ''): Map<string, string> {
  const out = new Map<string, string>();
  if (typeof value === 'string') out.set(trail, value);
  else if (Array.isArray(value)) value.forEach((item, index) => strings(item, `${trail}[${index}]`).forEach((v, k) => out.set(k, v)));
  else if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) strings((value as Record<string, unknown>)[key], trail ? `${trail}.${key}` : key).forEach((v, k) => out.set(k, v));
  }
  return out;
}

// Textos que son iguales en los dos idiomas a propósito: marcas, símbolos, nombres propios, palabras que se escriben igual
// (Manual, Color) o un marcador de datos que no se muestra (`clima`).
const SAME_ON_PURPOSE = /^(Wi-Fi|WiFi|Email|OK|Open-Meteo|IA|AI|Verificador|Español|English|Manual|Color|clima|[\d\s%:.,·•→←+\-–—/()]*)$/;

describe('traducciones al inglés', () => {
  const modules = localizedModules(SRC);

  it('encuentra los módulos de textos', () => {
    expect(modules.length).toBeGreaterThanOrEqual(25);
  });

  describe.each(modules.map((file) => [path.relative(SRC, file).split(path.sep).join('/'), file]))('%s', (_name, file) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const copy = require(file).default as Record<string, unknown>;

    afterEach(resetLocaleForTests);

    it('el inglés tiene las mismas claves que el español y ningún texto vacío', async () => {
      const storage = memoryStorage();
      await setLocale('es', storage);
      const es = strings(copy);
      await setLocale('en', storage);
      const en = strings(copy);

      expect([...en.keys()].sort()).toEqual([...es.keys()].sort());
      const empty = [...en].filter(([, text]) => text.trim() === '').map(([key]) => key);
      expect(empty).toEqual([]);
    });

    it('casi todo lo que está en español se tradujo', async () => {
      const storage = memoryStorage();
      await setLocale('es', storage);
      const es = strings(copy);
      await setLocale('en', storage);
      const en = strings(copy);

      const untranslated = [...es].filter(([key, text]) => en.get(key) === text && !SAME_ON_PURPOSE.test(text) && /[A-Za-zÁÉÍÓÚáéíóúñ]{3,}/.test(text));
      expect(untranslated.map(([key, text]) => `${key}: ${text}`)).toEqual([]);
    });
  });
});
