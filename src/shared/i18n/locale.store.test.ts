import { memoryStorage } from '@/db/local/testing/memoryStorage';

import { getLocale, loadLocale, resetLocaleForTests, setLocale, subscribeLocale } from './locale.store';

describe('idioma de la app', () => {
  beforeEach(resetLocaleForTests);

  it('arranca en español', () => {
    expect(getLocale()).toBe('es');
  });

  it('cambiar el idioma avisa a los suscriptores y lo guarda', async () => {
    const storage = memoryStorage();
    const seen: string[] = [];
    subscribeLocale((locale) => seen.push(locale));

    await setLocale('en', storage);

    expect(getLocale()).toBe('en');
    expect(seen).toEqual(['en']);
    expect(await storage.getItem('app-language')).toBe('en');
  });

  it('elegir el idioma que ya está no avisa de nada', async () => {
    const listener = jest.fn();
    subscribeLocale(listener);
    await setLocale('es', memoryStorage());
    expect(listener).not.toHaveBeenCalled();
  });

  it('al abrir la app se recupera el idioma guardado', async () => {
    const storage = memoryStorage();
    await storage.setItem('app-language', 'en');
    expect(await loadLocale(storage)).toBe('en');
    expect(getLocale()).toBe('en');
  });

  it('un valor guardado que no es un idioma se ignora', async () => {
    const storage = memoryStorage();
    await storage.setItem('app-language', 'fr');
    expect(await loadLocale(storage)).toBe('es');
  });

  it('si el almacenamiento falla, el cambio aplica igual durante la sesión', async () => {
    const broken = { ...memoryStorage(), setItem: () => Promise.reject(new Error('lleno')), getItem: () => Promise.reject(new Error('roto')) };
    await expect(setLocale('en', broken)).resolves.toBeUndefined();
    expect(getLocale()).toBe('en');
    expect(await loadLocale(broken)).toBe('en');
  });
});
