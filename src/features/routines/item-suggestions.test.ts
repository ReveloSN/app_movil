import { ITEM_SUGGESTIONS, pickSuggestions } from './item-suggestions';
import { ITEM_LABEL_MAX_LENGTH } from './routine.validation';

describe('sugerencias de ítems (04-4)', () => {
  it('muestra como mucho 4, en orden', () => {
    expect(pickSuggestions([]).map((item) => item.label)).toEqual(['Llaves', 'Billetera', 'Celular cargado', 'Cargador']);
  });

  it('no sugiere lo que ya está, sin importar mayúsculas, tildes ni espacios', () => {
    const labels = pickSuggestions([' llaves', 'BILLETERA', 'celular cargado']).map((item) => item.label);
    expect(labels).toEqual(['Cargador', 'Estufa apagada', 'Puerta con seguro', 'Luces apagadas']);
    expect(pickSuggestions(['audifonos'], [{ label: 'Audífonos', kind: 'carry', critical: false }])).toEqual([]);
  });

  it('las etiquetas cumplen el límite de 32 caracteres', () => {
    expect(ITEM_SUGGESTIONS.every((item) => item.label.length <= ITEM_LABEL_MAX_LENGTH)).toBe(true);
  });
});
