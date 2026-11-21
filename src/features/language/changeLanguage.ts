import { applyNotificationLanguage } from '@/features/notifications/notification.language';
import { refreshWidget } from '@/features/widget/widget.refresh';
import { setLocale } from '@/shared/i18n/locale.store';
import type { Locale } from '@/shared/i18n/locale.types';

/**
 * Cambia el idioma de la app y de lo que vive fuera de ella: el widget se vuelve a dibujar y las
 * notificaciones (canales, botones y las ya programadas) se rehacen con el texto nuevo.
 * Primero se aplica y guarda el idioma: lo demás lee el idioma activo.
 */
export async function changeLanguage(next: Locale): Promise<void> {
  await setLocale(next);
  refreshWidget();
  await applyNotificationLanguage();
}
