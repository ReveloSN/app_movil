# Estructura de `src/`

Arquitectura por feature + Atomic Design para la UI compartida.

```
src/
├── app/                    Rutas Expo Router (Pages: P03, P04, P07…). Solo pantallas y _layout.tsx.
├── components/             UI compartida, "tonta" (solo props → render). Sin fetching ni lógica de dominio.
│   ├── atoms/              Botón primario, chip de estado, checkbox, ícono con texto alternativo.
│   ├── molecules/          Fila de ítem, tarjeta de rutina, campo de formulario con label, estados EV/ER.
│   ├── organisms/          Lista de ítems (P07-2), tarjetas de Inicio (P03-3), barra de pestañas.
│   └── templates/          Layout de cada pantalla sin datos reales (ej. plantilla de P07).
├── features/               Lógica de dominio por feature: hooks (useX.ts), servicios (x.service.ts),
│   │                       tipos (x.types.ts) y componentes contenedores propios de la feature.
│   ├── auth/               AuthProvider + useAuth, validación y formulario de credenciales.
│   ├── routines/           Routine + Item: CRUD, validación (nombre ≤ 24, ítems 1–12).
│   ├── checklist/          Flujo de verificación, actualización optimista al marcar ítems.
│   ├── triggers/           Trigger (0–3 por rutina). Patrón Strategy:
│   │   └── strategies/     horario, salir de Wi-Fi, entrar a Wi-Fi (una estrategia por archivo).
│   ├── notifications/      Programación y acciones de Notification (posponer, abrir verificación).
│   ├── records/            Record: historial y rachas (escucha eventos de verificación completada).
│   ├── routine-templates/  Template: plantillas predefinidas de rutinas.
│   └── settings/           Settings + HomeNetwork.
├── db/                     Acceso a datos (patrón Repository). Hoy: Supabase. Caché offline: pendiente.
│   └── repositories/       x.repository.ts — única capa que habla con Supabase.
│                           Interfaz común: create / getAll / update / delete.
└── shared/
    ├── lib/                Clientes externos (supabase.ts) y su adaptador de sesión.
    ├── theme/              Design tokens (colores, tipografía, espaciado, tamaños táctiles 56pt).
    ├── types/              Tipos transversales que no pertenecen a una sola feature.
    ├── hooks/              Hooks genéricos sin dominio (ej. useDebounce).
    ├── events/             Event emitter (Observer): desacopla "verificación completada" de registro/racha.
    └── utils/              Utilidades puras y pequeñas, un archivo por responsabilidad (nada de utils.ts gigante).
```

## Reglas de dependencia

- `app/` → `features/` → `db/` y `shared/`. Nunca al revés.
- `components/` no importa de `features/` ni de `db/`.
- Una feature no llama a Supabase directamente (salvo `auth`): usa su repositorio, inyectado en el servicio/hook.
