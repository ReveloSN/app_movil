# Verificador de Salida

App Android que evita olvidos al salir de casa con rutinas de verificación rápidas: llaves, billetera, estufa, lo que tú elijas. Te avisa por horario o al dejar tu Wi-Fi y funciona sin conexión.

## Descargar

[**Descargar el APK (última versión)**](https://github.com/ReveloSN/app_movil/releases/latest/download/verificador-salida-v1.0.0.apk)

Todas las versiones: [Releases](https://github.com/ReveloSN/app_movil/releases).

## Instalar

1. Descarga el APK desde el enlace de arriba, directamente en tu teléfono.
2. Ábrelo. Android pedirá activar **"Instalar apps desconocidas"** para tu navegador o gestor de archivos: actívalo solo para esta instalación.
3. Play Protect puede avisar que la app no viene de la tienda; es normal. Elige "Instalar de todos modos".
4. Al abrir, toca **"Continuar sin cuenta"**: el modo invitado no pide correo ni contraseña. Si cierras sesión siendo invitado, pierdes tus datos.

Requiere Android 7 o superior (recomendado 13+ para recibir las notificaciones).

## Qué datos se guardan y dónde

- Tus rutinas, ítems, avisos, redes de casa y el historial de verificaciones se guardan en tu teléfono y se sincronizan con una base en Supabase.
- No guardamos tu ubicación: el teléfono la pide solo para leer el nombre del Wi-Fi.
- "Crear con IA" tiene un límite diario de uso por persona.
- Sin conexión la app sigue funcionando y sincroniza cuando vuelve la red.

## Para desarrolladores

Expo + React Native + TypeScript, solo Android. Variables en `.env` (ver `.env.example`).

```bash
npx tsc --noEmit && npx expo lint && npx jest --ci
npx expo start --dev-client
```
