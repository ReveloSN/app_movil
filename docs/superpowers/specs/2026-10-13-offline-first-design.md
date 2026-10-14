# Diseño: rutinas sin conexión (offline-first) + modo invitado

- **Fecha:** 2026-10-13
- **Estado:** borrador para revisión. No se ha escrito código.
- **Objetivo:** crear, editar y borrar rutinas (con sus ítems, avisos y redes de casa) funciona completamente sin internet. Los cambios se sincronizan solos con Supabase cuando vuelve la conexión. Además, se agrega un modo invitado para entrar sin cuenta.

---

## 1. Exploración: cómo está hoy

### 1.1 Cómo funciona hoy "terminar una verificación" sin conexión

Ya existe una cola de pendientes, pero solo para verificaciones (`records`):

| Pieza | Archivo | Qué hace |
|---|---|---|
| Cola | `src/features/checklist/pendingSync.ts` | Array JSON en AsyncStorage, clave `pending-verification-records`. Cada entrada es `{ userId, record, queuedAt }`. |
| Encolar | `useFinishChecklist.ts`, `notifications/record.writer.ts` | Sin conexión, o si el `create` falla por red, el registro va a la cola. La verificación se da por terminada igual. |
| Idempotencia | `Crypto.randomUUID()` en el cliente | Reintentar no duplica. Si el servidor responde `23505` (ya existe), se cuenta como guardado. |
| Reintento | `ChecklistSyncProvider.tsx` | `flush()` al abrir la app y cada vez que vuelve la conexión, solo con sesión. |
| Reintento en segundo plano | `notifications/trigger.maintenance.ts` | `flush()` también corre al volver a primer plano y en la tarea de fondo (cada ≥15 min, según Android). |
| Orden y concurrencia | `serialized()` dentro de `pendingSync.ts` | Todas las operaciones de la cola van en serie. Es el mismo patrón que `shared/lib/serialQueue.ts` (duplicado). |

Comportamiento de `flush()`: envía en orden y se detiene en el primer error de red, conservando el resto. Las entradas de otra cuenta se conservan sin enviar. **Cualquier otro error (RLS, restricción, clave foránea) descarta el registro en silencio**: solo deja un `console.warn` en desarrollo.

**¿Sirve para reusar? Sí el mecanismo, no el archivo tal cual.** Las ideas son las correctas: id generado en el cliente, `23505` = ya hecho, parar en error de red, entradas por usuario y escritura en serie. Pero la cola solo sabe crear registros (tipo fijo), no actualiza ni borra, y no ordena operaciones entre tablas.

**Una segunda cola en paralelo causaría pérdidas.** Si se crea una rutina sin conexión y se termina una verificación de esa rutina, y la cola de registros se envía antes que la de rutinas, el servidor responde `23503` (clave foránea). `flush()` lo trata como error permanente y **descarta el registro sin avisar**.

→ **Decisión:** generalizar este mecanismo en **una sola cola ordenada (outbox)** para todas las tablas, y migrar a ella los registros pendientes que haya. No se crea un mecanismo paralelo.

### 1.2 Qué datos tocan los repositorios y qué necesita funcionar offline

Hay 7 repositorios en `src/db/repositories/`, y en la app hay 6 tablas en uso:

| Tabla | Columnas (según los `Row` del código) | Id lo genera | La usan | ¿Offline? |
|---|---|---|---|---|
| `routines` | id, user_id, name, icon, color, active, last_completed_at, created_at | servidor | Inicio, P04 (crear/editar), borrar, armado de avisos | **Sí** |
| `items` | id, routine_id → routines, label, icon, type, critical, note, sort_order | servidor | P04, **la verificación** (`useChecklist` hoy los pide a la red), avisos | **Sí** |
| `triggers` | id, routine_id → routines, type, time, days, network_id → home_networks, window_start, window_end, active | servidor | P06, armado de avisos | **Sí** |
| `home_networks` | id, user_id, display_name, ssid, place | servidor | Se crean al guardar un aviso de Wi-Fi (`resolveNetwork` busca por SSID, crea o renombra) y en P11 (renombrar/borrar) | **Sí** |
| `settings` | user_id (PK), do_not_disturb, snooze_minutes, sound | servidor (`auth.uid()`) | P11 y avisos | **Sí** (1 fila) |
| `records` | id, routine_id → routines, date, result, items_checked, duration_seconds | **cliente** | Verificación (crear), Historial (leer) | Crear: ya funciona. Leer el historial: sigue siendo remoto (ver §2.1). |
| `templates` | — | — | **Nadie:** la app usa `PRESET_TEMPLATES` (datos locales) | No aplica |

**Por qué `home_networks` es obligatoria.** Un aviso de Wi-Fi guarda `network_id`. Al crear una rutina con un aviso de Wi-Fi sin conexión, `resolveNetwork` necesita la lista de redes para reutilizar la que tenga el mismo SSID, o crear una nueva con id local. Si las redes no están en local:

- el aviso no tiene a qué apuntar;
- un aviso nuevo con una red nueva no podría sincronizarse antes que su red (clave foránea).

Por la misma razón, el orden de la cola importa: red → aviso, rutina → ítems/avisos, rutina → registros.

**Ya son locales hoy** (no se tocan): la copia de avisos armados (`armed-triggers`), las ocurrencias de notificaciones, las preferencias de notificación, la marca de onboarding, el último Wi-Fi visto, la red vista por última vez y el tema.

### 1.3 Almacenamiento local: expo-sqlite vs AsyncStorage

Tamaño esperado de los datos: 10 rutinas × (1 + 12 ítems + 3 avisos) ≈ 160 filas, más algunas redes y 1 fila de ajustes, es decir unos **30–60 KB en JSON**. El historial no se copia a local.

| | expo-sqlite | AsyncStorage + documento JSON (**recomendado**) |
|---|---|---|
| Instalación | Módulo nativo nuevo: `npx expo install expo-sqlite` + **nueva compilación nativa** (~10–30 min) y reinstalar en el teléfono | Ya instalado y usado en 10 lugares |
| Relaciones | Claves foráneas y JOIN reales | En memoria. Ya se hace así hoy en `trigger.sync.ts` y `routine-load.service.ts` |
| Atomicidad | Transacciones SQL | Un solo documento por usuario: escribirlo es atómico para todas las "tablas" a la vez |
| Esquema | Hay que mantener un segundo esquema (local) y sus migraciones (`PRAGMA user_version`) | Un tipo TypeScript, con versión dentro del documento |
| Pruebas | Hay que simular el módulo nativo | Ya existe `KeyValueStorage` inyectable (como en `pendingSync`) |
| Escala | Miles de filas, consultas e índices | Se reescribe el documento entero en cada cambio: bien hasta cientos de KB (límite de Android ~6 MB) |
| Esfuerzo extra | **+400–600 líneas** y una recompilación | — |

**Recomendación: AsyncStorage con un documento JSON por usuario.** Con este volumen, las relaciones se resuelven bien en memoria, y la escritura atómica de todo el documento es más simple que coordinar transacciones. SQLite valdría la pena si en el futuro se quiere el historial completo offline (miles de filas) o hacer consultas.

**Riesgo conocido de ambas opciones.** La tarea en segundo plano y la app podrían escribir a la vez si corren en procesos de JavaScript distintos. Hoy `pendingSync` ya tiene ese riesgo. Se mitiga con que el fondo solo **agrega** a la cola y nunca reescribe las tablas.

### 1.4 Otros hallazgos que afectan el diseño

1. **La sesión se pierde sin internet.** Lo verifiqué en `@supabase/auth-js`, `GoTrueClient.__loadSession`. Si el token caducó (~1 h) y no hay red para renovarlo, `getSession()` devuelve `null`. `AuthProvider` lo interpreta como "sin sesión" y `RequireSession` manda al login. **Sin arreglar esto, la app no puede abrirse offline.** Afecta a todos los usuarios, no solo a los invitados.
2. **Toda la app usa `session?.user.id`** como dueño de los datos: 9 archivos (sincronización, historial, avisos, onboarding, rutinas).
3. **`last_completed_at` nunca lo escribe la app.** Seguramente lo actualiza un trigger de la base al insertar un `record` (hay que confirmarlo, §7). Sin conexión, la tarjeta no mostrará "última vez" hasta sincronizar.
4. **Las escrituras de rutinas no son atómicas hoy.** `routine.service` y `routine-edit.service` hacen varios pasos remotos con "rollback de mejor esfuerzo". Con offline-first, guardar una rutina pasa a ser **una sola escritura local atómica**, y la complejidad se mueve a la sincronización.
5. **El proyecto no tiene pruebas automáticas** (ni Jest ni ningún test). La sincronización es lógica delicada, así que conviene agregarlas (§5).

---

## 2. Diseño propuesto

### 2.1 Qué se guarda localmente y qué sigue siendo remoto

| Dato | Dónde vive | Notas |
|---|---|---|
| routines, items, triggers, home_networks, settings | **Local primero.** La app lee y escribe solo en local; Supabase es la copia de respaldo y sincronización. | Todo lo de crear/editar/borrar rutinas y P11 funciona sin red. |
| records (crear) | **Local primero**, a través de la misma outbox | Igual que hoy, pero en la cola unificada. |
| records (leer, Historial P10) | **Remoto** | Sin conexión se ve el último error de carga como hoy. *Opcional:* mostrar también las verificaciones pendientes de la outbox. |
| templates | Locales (`PRESET_TEMPLATES`) | Sin cambios. |
| Sesión | SecureStore (como hoy) | Se agrega el arreglo de §2.6. |

### 2.2 Documento local y outbox

Hay un documento por usuario en AsyncStorage, con la clave `local-db:<userId>`:

```
LocalDocument {
  version: 1
  tables: { routines[], items[], triggers[], homeNetworks[], settings | null }  // entidades del dominio
  outbox: OutboxOp[]                                                           // cambios pendientes, en orden
  lastPulledAt: string | null
}
```

Cada operación de la outbox:

```
OutboxOp = { opId, queuedAt, at /* hora del cambio en el dispositivo */, attempts, failed?: { code, message } }
         & ( { kind: 'insert', table, id, values }
           | { kind: 'update', table, id, changes }
           | { kind: 'delete', table, id }
           | { kind: 'deleteRoutine', id }        // en el servidor: deleteRoutineCascade (ya existe)
           | { kind: 'insertRecord', record } )   // lo que hoy hace pendingSync
```

**Escritura local.** Un cambio hecho desde un servicio sigue estos pasos, en serie con `createSerialQueue`:

1. Lee el documento.
2. Aplica el cambio a `tables`. Si es una creación, genera el `id` con `Crypto.randomUUID()`. Siempre pone `updatedAt = now`.
3. Agrega la operación a `outbox`.
4. Guarda el documento entero, en una sola escritura (atómica).
5. Avisa a los suscriptores (para que las pantallas se refresquen).

**Compactación al encolar**, para que la cola no crezca y haya menos conflictos:

| Si ya hay pendiente… | …y llega | Resultado |
|---|---|---|
| `insert X` | `update X` | Un solo `insert X` con los valores finales |
| `insert X` | `delete X` | Se eliminan ambos (nunca existió en el servidor) |
| `update X` | `update X` | Un solo `update X`, con los cambios combinados y el `at` más reciente |
| `update X` | `delete X` | Solo `delete X` |

**Borrar una rutina en local:** se quitan del documento la rutina, sus ítems y sus avisos, y se encola una sola operación `deleteRoutine`. Al sincronizar, esa operación ejecuta el `deleteRoutineCascade` que ya existe, con los repositorios remotos. Así se respeta lo que ya maneja (cascada en la base, o borrado manual de avisos, ítems e historial).

### 2.3 Cuándo se marca como pendiente y cuándo se sincroniza

- **Pendiente:** todo cambio local queda pendiente mientras su operación esté en la `outbox`. No hay un campo extra en las entidades. La UI puede preguntar "¿esta rutina tiene cambios sin subir?" mirando la outbox.
- **Cuándo se intenta sincronizar (las dos cosas que preguntaste: por eventos y periódicamente):**
  1. Al abrir la app con sesión y conexión.
  2. Al volver la conexión (NetInfo pasa de sin conexión a conectado). Hoy ya pasa con `flush`.
  3. Al volver la app a primer plano (`AppState` → `active`).
  4. Después de cada cambio local, si hay conexión, con 1–2 s de espera para agrupar varios cambios seguidos.
  5. **Periódico:** en la tarea de segundo plano que ya existe (`runTriggerMaintenance`, cada ≥15 min según Android), donde hoy está `flush`. Ahí solo se **envía** (push); la descarga (pull) se hace con la app abierta.
- **Una sincronización a la vez.** Si llega un pedido mientras otra corre, se marca "repetir al terminar".

**Algoritmo de sincronización (push y luego pull):**

1. **Push.** Recorre la outbox en orden (FIFO) y usa los repositorios de Supabase de siempre:
   - `insert`: inserta con el id del cliente. Si responde `23505` (ya existe), cuenta como hecho, igual que hoy.
   - `update`: actualización condicional: `update … set …, updated_at = op.at where id = X and updated_at < op.at`.
     - Si cambia 1 fila: hecho.
     - Si cambia 0 filas: el servidor tiene una versión más nueva o la fila ya no existe. Se descarta el cambio local como **conflicto perdido** (§2.4).
   - `delete` / `deleteRoutine`: borra. Si la fila ya no existe, cuenta como hecho (idempotente).
   - **Error de red:** se detiene ahí y se conserva el resto (como hoy).
   - **Error permanente:** se marca `failed` y **no se borra** (§2.5). Se sigue con las siguientes operaciones que no dependan de ella.
2. **Pull.** Si el push no se cortó por la red, pide todas las tablas del usuario con 5 `getAll` (lo mismo que hace hoy `fetchArmedTriggers`) y mezcla:
   - Las filas remotas **reemplazan** a las locales, **salvo** que la fila tenga una operación pendiente en la outbox, en cuyo caso gana la local.
   - Las filas que solo existen en local y tienen un `insert` pendiente se conservan.
   - Las filas locales que ya no están en el servidor y no tienen nada pendiente se eliminan, porque se borraron en otro dispositivo.
3. Si algo cambió, avisa a las pantallas y vuelve a armar los avisos (`rearm`).

La mezcla es una **función pura** (entrada: documento local + filas remotas; salida: documento nuevo), fácil de probar.

### 2.4 Conflictos: el mismo dato editado en dos dispositivos

**Propuesta: gana la edición más reciente, fila por fila, comparando la hora del cambio (`updated_at`). Cuando un cambio local pierde, se avisa al usuario.**

- Hace falta agregar la columna `updated_at` a 5 tablas (SQL en §2.8). La pone el **cliente** con la hora en que se hizo el cambio, no la de la sincronización. Por eso **no** se usa un trigger del servidor que la sobrescriba.
- **Ejemplo:** el dispositivo A edita la rutina sin conexión a las 10:00. El dispositivo B la edita con conexión a las 10:05. Cuando A sincroniza a las 11:00, su actualización condicional (`updated_at < 10:00`) no cambia nada, porque el servidor tiene 10:05. El cambio de A se descarta y el pull le trae la versión de B.
- **No es una pérdida silenciosa:** al terminar la sincronización se muestra un mensaje con el `flashMessage` que ya existe, por ejemplo: *"Algunos cambios hechos sin conexión se reemplazaron por otros más recientes de otro dispositivo."*
- **Borrar gana siempre.** Si un dispositivo borra la rutina y el otro la edita, la rutina queda borrada. Si el que editó sincroniza después, su `update` no encuentra la fila, el cambio se descarta y se muestra el mismo aviso. Es la regla más simple y coincide con la intención de borrar.
- **Límite conocido:** la comparación es por fila, no por rutina completa. Si A agrega ítems y B agrega otros a la misma rutina sin conexión, al sincronizar quedan los de ambos. Si eso supera 12 ítems y la base tiene esa restricción, la operación queda como `failed` (§2.5), sin perderse en silencio.
- **Hora del teléfono:** si los relojes de los dispositivos difieren mucho, puede ganar el "equivocado". Para una app de un usuario por cuenta es aceptable, pero lo documento.

### 2.5 Errores permanentes: nunca descartar en silencio

Un error que no es de red ni `23505` marca la operación como `failed` (con código y mensaje) y la deja en la outbox. Ejemplos: RLS, restricción, clave foránea.

- Las operaciones posteriores **sobre la misma fila o sobre filas que dependen de ella** quedan **bloqueadas**: no se envían, porque fallarían igual por clave foránea, pero tampoco se marcan como fallidas ni se borran. Las dependencias, con la tabla padre a la izquierda, son:
  - `routines` → `items` (`routine_id`), `triggers` (`routine_id`) y **`records` (`routine_id`)**. Una verificación terminada para una rutina cuyo `insert` falló queda bloqueada igual que sus ítems y avisos.
  - `home_networks` → `triggers` (`network_id`). Un aviso de Wi-Fi cuya red nueva no se pudo subir queda bloqueado.
- El bloqueo es transitivo: si falla la red, se bloquea el aviso; y si falla la rutina, se bloquean sus avisos y las verificaciones de esa rutina.
- **Reintentar** una operación fallida vuelve a intentar también las que bloqueaba. **Descartar** una operación fallida descarta también las que dependen de ella. Antes de hacerlo se avisa cuántas son, por ejemplo: *"Se descartarán también 4 ítems, 1 aviso y 2 verificaciones de esta rutina."*
- Las operaciones independientes siguen sincronizándose normalmente.
- Una verificación cuya rutina **se borró en otro dispositivo** (el servidor responde `23503`) no está bloqueada por nada local: queda como `failed` y visible, nunca descartada en silencio.
- En **Ajustes** aparece un bloque **"Cambios sin sincronizar"**: cantidad pendiente, cantidad con error, y las opciones **Reintentar** y **Descartar**. También aparece un indicador pequeño en Inicio cuando hay pendientes (con ícono y texto, nunca solo color).
- Esto **cambia el comportamiento actual de `pendingSync`**, que hoy descarta en silencio.

### 2.6 Sesión sin internet y modo invitado

**Sesión offline.** `AuthProvider` pasa a exponer `user: { id, email, isAnonymous } | null`, además de `session`.

- Si `getSession()` falla **por red** y hay una sesión guardada, se usa el usuario de esa sesión guardada (modo "sin conexión").
- Al volver la red, supabase-js renueva el token solo.
- Si la renovación falla porque la sesión se cerró en el servidor, el usuario va al login, pero **sus cambios pendientes se conservan** en `local-db:<userId>` hasta que vuelva a entrar.
- Los 9 archivos que usan `session?.user.id` pasan a `user?.id` (cambio mecánico).

**Modo invitado.**

- Botón **"Continuar sin cuenta"** en el login, que usa `supabase.auth.signInAnonymously()`.
- Necesita internet **solo la primera vez**. Si no hay red, se muestra: *"La primera vez necesitas internet para crear tu espacio. Después la app funciona sin conexión."*
- Después, el invitado es un usuario normal: tiene un `id` real, sus datos se sincronizan y RLS funciona igual.
- En Ajustes, la cuenta se muestra como **"Invitado (sin cuenta)"**.
- Al **cerrar sesión siendo invitado**, se pide confirmación: *"Si cierras sesión perderás tus rutinas: un invitado no puede volver a entrar."* Si además hay cambios sin sincronizar, se avisa también para cuentas normales.
- **Fuera de alcance:** convertir un invitado en cuenta con correo. Es posible después con `updateUser({ email, password })` y conserva el mismo id y los datos.
- **Requisito en Supabase:** activar *Authentication → Sign In / Providers → Allow anonymous sign-ins*.

### 2.7 Qué cambia, por repositorio y por archivo

**Las interfaces de los repositorios no cambian** (`Repository`, `getByRoutine`, `deleteByRoutine`, etc.). Lo que cambia es la implementación que entrega la raíz de composición. Por eso los servicios (`routine.service`, `routine-edit.service`, `trigger.service`, `routine-load.service`, `trigger.sync`, `useHomeNetworks`, `useSettings`, `settings.service`) **casi no se tocan**. Es la inversión de dependencias y la sustitución de Liskov que ya pide el proyecto.

| Repositorio | Hoy | Después |
|---|---|---|
| `routine.repository` | Supabase directo | **Local-first:** lee de `tables.routines`; las escrituras van a local + outbox; `delete` borra en cascada en local y encola `deleteRoutine` |
| `item.repository` | Supabase | **Local-first:** `getByRoutine` y `deleteByRoutine` sobre la tabla local |
| `trigger.repository` | Supabase | **Local-first** |
| `home-network.repository` | Supabase | **Local-first.** Si al subir un `insert` hay conflicto por SSID (si existe `UNIQUE(user_id, ssid)`, ver §7), se adopta el id remoto y se reescribe `network_id` en los avisos locales. |
| `settings.repository` | Supabase | **Local-first** (1 fila, id = userId) |
| `verification-record.repository` | Supabase + cola aparte | `create` va a la outbox (`insertRecord`) y siempre es instantáneo; `getAll` (Historial) sigue remoto |
| `routine-template.repository` | sin uso | sin cambios |
| `supabase.repository` (base) | Lo usa toda la app | Lo usa **solo la sincronización.** Se agregan insert con id del cliente, `updateIfOlder(id, changes, at)` → `'applied' \| 'stale'`, y el mapeo de `updated_at`. |

**Archivos nuevos** (inglés en el código, según CLAUDE.md):

| Archivo | Responsabilidad única |
|---|---|
| `src/db/local/local-document.types.ts` | Tipos del documento y de `OutboxOp` |
| `src/db/local/local.store.ts` | Leer/escribir el documento en serie y avisar a los suscriptores |
| `src/db/local/outbox.ts` | Encolar con compactación, marcar `failed`, reintentar/descartar |
| `src/db/local/local.repository.ts` | Repositorio local-first genérico (implementa `Repository`) |
| `src/db/local/local.tables.ts` | Configuración por tabla (dependencias padre→hija, cascada) |
| `src/db/sync/sync.push.ts` | Envía la outbox en orden usando los repositorios remotos |
| `src/db/sync/sync.merge.ts` | Mezcla pura de local + remoto (pull) |
| `src/db/sync/sync.engine.ts` | Una sincronización a la vez: push → pull → avisar |
| `src/features/sync/SyncProvider.tsx` | Cuándo sincronizar (abrir, reconectar, primer plano, tras un cambio); expone el estado |
| `src/features/sync/useSyncStatus.ts` + `SyncStatusSection.tsx` | Estado en Ajustes (pendientes, errores, Reintentar/Descartar) |

**Archivos que cambian:**

- `db/app.repositories.ts`: entrega los repositorios local-first y aparte los remotos para la sincronización.
- `shared/types/*.types.ts`: `updatedAt` en las 5 entidades e `id?` opcional en los inputs de creación.
- `features/auth/*` y `app/(auth)/login.tsx`: sesión offline e invitado.
- `app/(tabs)/settings.tsx`: muestra "Invitado" y las confirmaciones al cerrar sesión.
- `features/checklist/pendingSync.ts` + `ChecklistSyncProvider.tsx`: **se reemplazan** por la outbox y `SyncProvider`. Una migración de una sola vez mueve las entradas de `pending-verification-records` a la outbox del usuario dueño.
- `useFinishChecklist.ts` y `record.writer.ts`: llaman a `records.create` local, sin la rama `isConnected`.
- `notifications/trigger.maintenance.ts`: cambia `flush` por el push de la outbox.
- `notifications/TriggerRuntimeProvider.tsx`: `rearm` lee de local, así que **los avisos creados sin conexión se programan al instante**. Además, se vuelve a armar después de cada pull.
- `features/checklist/useChecklist.ts`: los ítems vienen de local, así que **la verificación abre sin conexión** (hoy falla).
- `features/routines/RoutinesProvider.tsx`: se suscribe al documento local para refrescar la lista tras una sincronización.

### 2.8 Cambios en Supabase

**Actualización 2026-10-14:** el proyecto anterior de Supabase quedó pausado y se reemplaza por uno nuevo. El esquema completo ahora está versionado en `supabase/migrations/20261014000000_initial_schema.sql` y **ya incluye `updated_at`** en las 5 tablas. Por eso la Fase 2 ya no necesita el `alter table`. En el proyecto nuevo también hay que activar **Allow anonymous sign-ins**.

---

## 3. Fases (cada una se puede probar y entregar por separado)

| Fase | Contenido | Tamaño |
|---|---|---|
| **1. Sesión offline + invitado** | §2.6. Desbloquea entrar sin cuenta y abrir la app sin red. Todavía no edita sin conexión. | Pequeña |
| **2. Base** | SQL de §2.8, `updatedAt` en los tipos, `supabase.repository` con insert con id y `updateIfOlder` | Pequeña |
| **3. Local + outbox** | `db/local/*`, repositorios local-first, raíz de composición, migración de `pendingSync`. Desde aquí se crea y edita sin red, pero sin subir todavía. | **Grande** |
| **4. Sincronización** | `db/sync/*`, `SyncProvider`, `rearm` tras pull, push en segundo plano | **Grande** |
| **5. UI de estado** | Indicador de pendientes, bloque en Ajustes, mensajes de conflicto, confirmaciones al cerrar sesión | Mediana |

Las fases 3 y 4 deben salir juntas a uso real, porque sin la 4 los cambios no suben. La 3 sí se puede revisar y probar sola.

## 4. Fuera de alcance

- El Historial completo sin conexión (solo, opcionalmente, mostrar las verificaciones pendientes).
- Actualización en tiempo real entre dispositivos (realtime). Se sincroniza en los momentos de §2.3.
- Mezcla campo por campo, o por rutina completa.
- Convertir un invitado en cuenta con correo.
- Offline en la versión web.

## 5. Pruebas

- **Automáticas (propuesta):** agregar Jest (`jest-expo`) solo como dependencia de desarrollo, para las partes puras y delicadas:
  - compactación de la outbox;
  - orden del push y manejo de `23505`, error de red y `failed`;
  - mezcla del pull;
  - migración de `pendingSync`.
- **Manuales, en el teléfono con modo avión:**
  1. Crear una rutina con un aviso de Wi-Fi y una red nueva sin conexión, volver la red y comprobar que todo aparece en Supabase en orden.
  2. Editar y borrar sin conexión.
  3. Terminar una verificación de una rutina creada sin conexión.
  4. Dos dispositivos editando la misma rutina (conflicto + aviso).
  5. Borrar en uno y editar en otro.
  6. Abrir la app sin red después de más de 1 h (no debe pedir login).
  7. Invitado: entrar, crear, cerrar sesión con confirmación.
- `npx expo lint` y `npx tsc --noEmit` en cada fase.

## 6. Estimación honesta de esfuerzo

Tamaño de lo que ya existe, medido en el repo:

| Trabajo | Líneas aprox. |
|---|---|
| P11 Ajustes (feature + pantalla) | ~650 |
| Notificaciones (feature) | ~900 |
| P06 Avisos (feature + estrategias + Wi-Fi + pantalla + moléculas) | ~1.600 |
| **Este cambio** | **~1.300–1.600 nuevas o cambiadas**, más ~300–400 de pruebas |

**En líneas, es parecido a P06 y unas 2–2,5 veces P11.** Pero es **el cambio más delicado del proyecto**, por cuatro razones:

- toca la capa de datos que usa toda la app;
- tiene casos difíciles que no se ven al usarla normalmente: orden de la cola, fallos a medias, dos dispositivos, la tarea en segundo plano;
- hoy no hay pruebas automáticas que avisen si algo se rompe;
- necesita que hagas cambios en Supabase.

Con SQLite en vez de AsyncStorage serían **+400–600 líneas y una recompilación nativa**.

Por eso propongo hacerlo **por fases**. La fase 1 es chica (~150–200 líneas) y te desbloquea hoy: entrar sin cuenta y abrir la app sin red.

## 7. Qué hay que confirmar en Supabase antes de la fase 2

**Resuelto (2026-10-14).** Con el proyecto nuevo, estas respuestas las define la migración inicial en lugar de consultarlas:

- **Ids:** `gen_random_uuid()` por defecto en todas las tablas, aunque el cliente puede mandar el suyo. `user_id` toma `auth.uid()` por defecto.
- **Borrado en cascada:** al borrar una rutina se borran sus ítems, avisos y verificaciones (`on delete cascade`). Una red que usa un aviso no se puede borrar (`on delete restrict`).
- **Únicos:** `home_networks (user_id, ssid)`. Al subir una red creada sin conexión que ya existe, el servidor responde `23505` y se adopta el id remoto (§2.7).
- **Triggers:** `last_completed_at` lo actualiza un trigger cuando se inserta un registro `completed`. Además hay un límite de 12 ítems y 3 avisos por rutina; superarlo da `check_violation`, que es un error permanente (§2.5).
- **RLS:** cada tabla filtra por dueño, ya sea directamente o a través de la rutina. Los invitados tienen el rol `authenticated`.

Las consultas originales quedan como referencia, para revisar cualquier otro proyecto:

```sql
-- Valores por defecto de id / user_id / fechas
select table_name, column_name, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('routines','items','triggers','home_networks','settings','records')
  and column_name in ('id','user_id','created_at','last_completed_at');

-- Claves foráneas (y si borran en cascada) y restricciones únicas
select tc.table_name, kcu.column_name, tc.constraint_type, rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
left join information_schema.referential_constraints rc on rc.constraint_name = tc.constraint_name
where tc.table_schema = 'public' and tc.constraint_type in ('FOREIGN KEY','UNIQUE');

-- Triggers de la base (¿quién actualiza last_completed_at? ¿hay límite de 12 ítems?)
select event_object_table, trigger_name, action_statement
from information_schema.triggers
where trigger_schema = 'public';

-- Políticas RLS (los invitados tienen rol "authenticated")
select tablename, policyname, roles, cmd from pg_policies where schemaname = 'public';
```

## 8. Decisiones que necesito de ti

1. **Almacenamiento:** ¿AsyncStorage con documento JSON (recomendado) o expo-sqlite?
2. **Conflictos:** ¿apruebas que gane la edición más reciente por fila, que borrar gane siempre y que se avise al usuario cuando un cambio local pierde?
3. **Pruebas:** ¿agrego Jest como dependencia de desarrollo para la sincronización?
4. **Orden:** ¿empezamos por la fase 1 (sesión offline + invitado) mientras revisas el resto?
