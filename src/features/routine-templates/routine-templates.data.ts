import type { ItemDraft, ItemKind } from '@/features/routines/routines.types';
import type { TriggerDraft } from '@/features/triggers/trigger.types';
import type { Weekday } from '@/shared/types/clock.types';

import type { PresetTemplate } from './routine-templates.types';

const item = (label: string, kind: ItemKind, critical = false): ItemDraft => ({ label, kind, critical });

const leaveWifi = (networkName: string): TriggerDraft => ({ type: 'wifi_exit', ssid: '', networkName, window: null });
const WEEKDAYS: readonly Weekday[] = [1, 2, 3, 4, 5];
const EVERY_DAY: readonly Weekday[] = [0, 1, 2, 3, 4, 5, 6];

// Contenido de P10. Nombres ≤ 24 caracteres e ítems ≤ 32 (límites de routine.validation).
export const PRESET_TEMPLATES: readonly PresetTemplate[] = [
  {
    id: 'leaving-home',
    name: 'Saliendo de casa',
    description: 'Lo esencial antes de cerrar la puerta.',
    icon: 'home-outline',
    items: [
      item('Llaves', 'carry', true),
      item('Billetera', 'carry'),
      item('Celular cargado', 'carry'),
      item('Cargador', 'carry'),
      item('Comida de la mascota servida', 'do'),
      item('Estufa apagada', 'check', true),
    ],
    suggestedTrigger: 'Salir del Wi-Fi de Casa',
    suggestedTriggerDraft: leaveWifi('Casa'),
  },
  {
    id: 'end-of-study',
    // El brief dice "Cerrando jornada de estudio" (27 caracteres): supera el máximo de 24 del nombre.
    name: 'Cerrando el estudio',
    description: 'Deja todo guardado y listo para mañana.',
    icon: 'school-outline',
    items: [
      item('Guardar archivos en la nube', 'do', true),
      item('Anotar pendiente de mañana', 'do'),
      item('Cargar portátil', 'do'),
      item('Ordenar escritorio', 'do'),
    ],
    suggestedTrigger: '6:00 p. m., L a V',
    suggestedTriggerDraft: { type: 'schedule', time: { hour: 18, minute: 0 }, days: [...WEEKDAYS] },
  },
  {
    id: 'leaving-work',
    name: 'Saliendo del trabajo',
    description: 'Que nada se quede en la oficina.',
    icon: 'briefcase-outline',
    items: [
      item('Portátil y cargador', 'carry'),
      item('Carné de acceso', 'carry', true),
      item('Tarro del almuerzo', 'carry'),
      item('Apagar pantalla', 'do'),
    ],
    suggestedTrigger: 'Salir del Wi-Fi de Trabajo',
    suggestedTriggerDraft: leaveWifi('Trabajo'),
  },
  {
    id: 'before-bed',
    name: 'Antes de dormir',
    description: 'Casa segura y todo listo para descansar.',
    icon: 'moon-outline',
    items: [
      item('Puerta con seguro', 'check', true),
      item('Gas cerrado', 'check', true),
      item('Alarma puesta', 'check'),
      item('Celular cargando', 'check'),
    ],
    suggestedTrigger: '10:30 p. m., diario',
    suggestedTriggerDraft: { type: 'schedule', time: { hour: 22, minute: 30 }, days: [...EVERY_DAY] },
  },
  {
    id: 'before-travel',
    name: 'Antes de viajar',
    description: 'Lo indispensable antes de salir de viaje.',
    icon: 'airplane-outline',
    items: [
      item('Documento de identidad', 'carry', true),
      item('Tiquete', 'carry'),
      item('Cargadores', 'carry'),
      item('Medicamentos', 'carry'),
      item('Nevera desconectada', 'check'),
    ],
    suggestedTrigger: 'Manual',
    suggestedTriggerDraft: null,
  },
  // Añadidas el 2026-10-18 (Estudiante, Casa/Familia, Gimnasio). "Trabajo" ya estaba (Saliendo del trabajo).
  {
    id: 'to-class',
    name: 'Saliendo a clase',
    description: 'Lo de la universidad, listo antes de salir.',
    icon: 'school-outline',
    items: [
      item('Carné estudiantil', 'carry', true),
      item('Portátil cargado', 'carry'),
      item('Cargador', 'carry'),
      item('Cuaderno', 'carry'),
      item('Botella de agua', 'carry'),
    ],
    suggestedTrigger: '6:30 a. m., L a V',
    suggestedTriggerDraft: { type: 'schedule', time: { hour: 6, minute: 30 }, days: [...WEEKDAYS] },
  },
  {
    id: 'family-outing',
    name: 'Salida en familia',
    description: 'Que nadie se quede sin lo suyo al salir juntos.',
    icon: 'car-outline',
    items: [
      item('Llaves del carro', 'carry', true),
      item('Documentos', 'carry', true),
      item('Agua y meriendas', 'carry'),
      item('Medicamentos', 'carry'),
      item('Luces apagadas', 'check'),
    ],
    suggestedTrigger: 'Manual',
    suggestedTriggerDraft: null,
  },
  {
    id: 'gym',
    name: 'Al gimnasio',
    description: 'Lo necesario para entrenar sin volver a casa.',
    icon: 'barbell-outline',
    items: [
      item('Ropa deportiva', 'carry'),
      item('Tenis', 'carry'),
      item('Toalla', 'carry'),
      item('Botella de agua', 'carry'),
      item('Candado del casillero', 'carry'),
      item('Audífonos', 'carry'),
    ],
    suggestedTrigger: 'Manual',
    suggestedTriggerDraft: null,
  },
];

export const findPresetTemplate = (id: string | undefined): PresetTemplate | undefined =>
  PRESET_TEMPLATES.find((template) => template.id === id);
