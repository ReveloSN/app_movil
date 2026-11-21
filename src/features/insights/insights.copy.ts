// Textos de "aprender de tus olvidos". Sin código en el Documento de Contenido: propuestos, pendientes de
// validar (voz y tono §02: breve, sin culpa, con solución).

import { localized } from '@/shared/i18n/localized';

import type { InsightPattern } from './insights.detect';

type PatternAction = 'mark_critical' | 'add_item';

const DAY_PLURAL_ES = ['Los domingos', 'Los lunes', 'Los martes', 'Los miércoles', 'Los jueves', 'Los viernes', 'Los sábados'];
const DAY_PLURAL_EN = ['On Sundays', 'On Mondays', 'On Tuesdays', 'On Wednesdays', 'On Thursdays', 'On Fridays', 'On Saturdays'];

const DAY_NAMES_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timesEs = (count: number) => (count === 1 ? '1 vez' : `${count} veces`);
const timesEn = (count: number) => (count === 1 ? 'once' : `${count} times`);

export default localized(
  {
    /**
     * Mensaje determinista (sin IA): siempre disponible, también sin conexión, sin consentimiento o sin cuota.
     * `action` dice qué se propone: marcar como crítico (el ítem ya está) o agregarlo a la rutina.
     */
    patternMessage: (pattern: InsightPattern, action: PatternAction = 'mark_critical'): string => {
      const verb = pattern.kind === 'forgot_weekday' ? 'sueles olvidar' : 'sueles omitir';
      const lead = pattern.kind === 'item' ? 'Sueles omitir' : `${DAY_PLURAL_ES[pattern.weekday]} ${verb}`;
      const ask = action === 'add_item' ? '¿Lo agregamos a tu rutina?' : '¿Lo marcamos como crítico?';
      return `${lead} «${pattern.label}». ${ask}`;
    },

    INSIGHT_ACCEPT: 'Marcar crítico',
    INSIGHT_ADD: 'Agregar a la rutina',
    /** ER-05 adaptado: la rutina llena no se toca. */
    INSIGHT_FULL: 'Tu rutina ya tiene 12 ítems: quita uno para agregarlo.',
    INSIGHT_DISMISS: 'Ahora no',
    insightMarked: (label: string) => `«${label}» ahora es crítico.`,
    INSIGHT_ERROR: 'No pudimos actualizar la rutina. Inténtalo de nuevo.',

    FORGOT_LABEL: 'Olvidé algo',
    FORGOT_TITLE: '¿Qué se te quedó?',
    FORGOT_FIELD: 'Ítem',
    FORGOT_PLACEHOLDER: 'Ej. Paraguas',
    FORGOT_SAVE: 'Añadir a la rutina',
    FORGOT_CLOSE: 'Cerrar',
    forgotAdded: (label: string) => `Añadimos «${label}» a tu rutina.`,
    /** ER-05 adaptado: se anota el olvido aunque la rutina esté llena. */
    FORGOT_FULL: 'Lo anotamos. Tu rutina ya tiene 12 ítems: quita uno para añadirlo.',
    forgotAlreadyInRoutine: (label: string) => `Lo anotamos. «${label}» ya está en tu rutina.`,
    FORGOT_ERROR: 'No pudimos añadirlo. Inténtalo de nuevo.',
    forgotInHistory: (labels: readonly string[]) => `Se te quedó: ${labels.join(', ')}`,

    // "Tu semana" (Historial).
    WEEK_TITLE: 'Tu semana',
    WEEK_EMPTY: 'Esta semana aún no hay verificaciones.',
    WEEK_GENERATE: 'Generar resumen',
    WEEK_LOADING: 'Preparando tu resumen…',
    WEEK_SOURCE_AI: 'Resumen con IA',
    WEEK_SOURCE_LOCAL: 'Resumen automático',
    weekCounts: (completed: number, partial: number, skipped: number) =>
      [
        completed === 1 ? '1 completa' : `${completed} completas`,
        partial === 1 ? '1 parcial' : `${partial} parciales`,
        `${skipped} hoy no salgo`,
      ].join(' · '),

    // Resumen automático (sin IA) de la semana; la lógica vive en `deterministicSummary` (weekly.ts).
    /** Se agrega tras el motivo del error cuando la IA falla y se muestra el resumen automático. */
    WEEKLY_FALLBACK_NOTE: 'Te mostramos el resumen automático.',
    summaryLead: (total: number, completed: number) =>
      `Esta semana verificaste ${timesEs(total)}: ${completed === 1 ? '1 completa' : `${completed} completas`}.`,
    summaryMoreThanLast: (diff: number) => (diff === 1 ? 'Es 1 más que la semana pasada.' : `Son ${diff} más que la semana pasada.`),
    summaryLastWeek: (previous: number) => `La semana pasada fueron ${previous}.`,
    summaryStreak: (days: number) => `Llevas ${days} días seguidos.`,
    summaryBestDay: (weekday: number) => `Tu mejor día fue el ${DAY_NAMES_ES[weekday]}.`,
    recommendTopSkipped: (label: string, count: number) =>
      `«${label}» se quedó ${timesEs(count)}: déjalo junto a la puerta la noche antes.`,
    RECOMMEND_PARTIAL: 'Revisa tu rutina y deja solo lo que de verdad no puede faltar.',
    RECOMMEND_KEEP_GOING: 'Sigue así: tu rutina ya te funciona.',
  },
  {
    patternMessage: (pattern: InsightPattern, action: PatternAction = 'mark_critical'): string => {
      const verb = pattern.kind === 'forgot_weekday' ? 'you tend to forget' : 'you tend to skip';
      const lead = pattern.kind === 'item' ? 'You tend to skip' : `${DAY_PLURAL_EN[pattern.weekday]} ${verb}`;
      const ask = action === 'add_item' ? 'Add it to your routine?' : 'Mark it as critical?';
      return `${lead} "${pattern.label}". ${ask}`;
    },

    INSIGHT_ACCEPT: 'Mark critical',
    INSIGHT_ADD: 'Add to routine',
    INSIGHT_FULL: 'Your routine already has 12 items: remove one to add this.',
    INSIGHT_DISMISS: 'Not now',
    insightMarked: (label: string) => `"${label}" is now critical.`,
    INSIGHT_ERROR: "We couldn't update the routine. Try again.",

    FORGOT_LABEL: 'I forgot something',
    FORGOT_TITLE: 'What did you leave behind?',
    FORGOT_FIELD: 'Item',
    FORGOT_PLACEHOLDER: 'E.g. Umbrella',
    FORGOT_SAVE: 'Add to routine',
    FORGOT_CLOSE: 'Close',
    forgotAdded: (label: string) => `We added "${label}" to your routine.`,
    FORGOT_FULL: 'Noted. Your routine already has 12 items: remove one to add this.',
    forgotAlreadyInRoutine: (label: string) => `Noted. "${label}" is already in your routine.`,
    FORGOT_ERROR: "We couldn't add it. Try again.",
    forgotInHistory: (labels: readonly string[]) => `You left behind: ${labels.join(', ')}`,

    WEEK_TITLE: 'Your week',
    WEEK_EMPTY: 'No checks yet this week.',
    WEEK_GENERATE: 'Generate summary',
    WEEK_LOADING: 'Preparing your summary…',
    WEEK_SOURCE_AI: 'AI summary',
    WEEK_SOURCE_LOCAL: 'Automatic summary',
    weekCounts: (completed: number, partial: number, skipped: number) =>
      [`${completed} complete`, `${partial} partial`, `${skipped} skipped for today`].join(' · '),

    WEEKLY_FALLBACK_NOTE: "We're showing the automatic summary.",
    summaryLead: (total: number, completed: number) => `This week you checked ${timesEn(total)}: ${completed} complete.`,
    summaryMoreThanLast: (diff: number) => (diff === 1 ? "That's 1 more than last week." : `That's ${diff} more than last week.`),
    summaryLastWeek: (previous: number) => `Last week it was ${previous}.`,
    summaryStreak: (days: number) => `You're on a ${days}-day streak.`,
    summaryBestDay: (weekday: number) => `Your best day was ${DAY_NAMES_EN[weekday]}.`,
    recommendTopSkipped: (label: string, count: number) =>
      `"${label}" got left behind ${timesEn(count)}: leave it by the door the night before.`,
    RECOMMEND_PARTIAL: "Review your routine and keep only what really can't be missed.",
    RECOMMEND_KEEP_GOING: 'Keep it up: your routine is already working for you.',
  },
);
