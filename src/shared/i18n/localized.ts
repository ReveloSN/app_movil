import { getLocale } from './locale.store';

/** Igual que T pero con los textos literales ensanchados a `string`, para que `en` no tenga que repetir los literales de `es`. */
export type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends (...args: infer A) => infer R
        ? (...args: A) => Widen<R>
        : T extends readonly (infer U)[]
          ? Widen<U>[]
          : T extends object
            ? { -readonly [K in keyof T]: Widen<T[K]> }
            : T;

/**
 * Textos de una pantalla o función en los dos idiomas. Se escribe el español (`es`, el de origen) y el
 * inglés (`en`) con la misma forma: TypeScript falla si a uno le falta una clave.
 *
 * El resultado se comporta como un objeto normal, pero cada propiedad se resuelve al leerla con el idioma
 * activo en ese momento. Por eso no hay que leerlo al cargar el módulo: dentro de un componente, de una función
 * o de un hook sí; en una constante de módulo se quedaría en el idioma de arranque.
 */
export function localized<T extends object>(es: T, en: Widen<T>): Widen<T> {
  const dictionaries: Record<string, Record<PropertyKey, unknown>> = {
    es: es as Record<PropertyKey, unknown>,
    en: en as Record<PropertyKey, unknown>,
  };
  const active = () => dictionaries[getLocale()] ?? dictionaries.es;

  return new Proxy(es as Widen<T>, {
    get(_target, key) {
      const dictionary = active();
      // Si al inglés le faltara una clave (no debería: lo impide el tipo), se muestra el español.
      return key in dictionary ? dictionary[key] : dictionaries.es[key];
    },
    has: (_target, key) => key in active(),
    ownKeys: () => Reflect.ownKeys(es),
    getOwnPropertyDescriptor: (_target, key) => Reflect.getOwnPropertyDescriptor(es, key),
  });
}
