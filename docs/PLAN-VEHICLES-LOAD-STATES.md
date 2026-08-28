# Plan: Estados de carga de la lista de vehículos y borrado con verificación real

**Fecha:** 2026-08-25
**Estado:** aprobado, en cola de ejecución (después de `PLAN-VEHICLES-BADGES.md`)

## Contexto

Con sesión válida, `QueryUserPlatesAPI` devuelve `HTTP 500 {"Message":"Error."}`
para cuentas sin matrículas (sospecha por confirmar con backend). La app cae a
mock y muestra el cartel genérico de "datos locales", confuso para usuarios
conectados.

Además, la verificación de borrado (`vehicle-edit.remove()`) se apoya en
`_activeParkings`, que solo se sincroniza con el backend desde el dashboard
(`loadParkingStatuses`), y esa sincronización usa `contractId = 0`, valor que
hace que `QueryParkingStatusAPI` devuelva `-9` siempre (verificado en vivo).
Resultado: el bloqueo de borrado por aparcamiento activo funciona con datos
locales/caché, no con datos reales frescos.

## Objetivo

Que la lista de vehículos distinga **4 estados** y muestre lo correcto:

| Estado | Condición | UI |
|---|---|---|
| **Sin sesión** | sin token | cartel actual "se guardan localmente…" |
| **Lista vacía real** | éxito (`isSuccess:true`) + `value:null` o `plates:[]` | empty-state existente ("Añade vehículo"), sin cartel |
| **Error controlado** | envelope `isSuccess:false` (p. ej. -9) | banner "error del servicio" + datos locales + Reintentar |
| **Error 500 / red** | HTTP != 200 o fallo de transporte | banner "error inesperado del servidor" + datos locales + Reintentar |

Y que el borrado de un vehículo se decida con **estado de aparcamiento real
y recién sincronizado**, manteniendo el cartel existente
(`account.vehicleEdit.activeParkingTitle/Message`, ya presentes en 4 idiomas).

## Cambios

### 1. `ops-api-client.service.ts`

Nuevo método `getOrNull<T>(endpoint, options)`:

- `isSuccess:true` + `value:null` → devuelve `null` (hoy lanza
  *"respuesta satisfactoria sin datos"*).
- Resto de errores (envelope, HTTP, timeout) → lanza `OpsApiError` como hasta
  ahora.

### 2. `vehicle.service.ts` — `load()`

```ts
const value = await this.api.getOrNull<PlatesApiValue>(...);
if (value === null || !Array.isArray(value.plates)) {
  this.state.set([]);
} else {
  this.state.set(value.plates.map((item) => this.fromApi(item)));
}
this.sourceState.set('remote');
await this.ensureFavorite();
```

Los errores reales siguen cayendo a `useMock()` (que ya guarda `lastError`
con su `kind`: `'backend'` controlado vs `'http'/'transport'` no controlado).

### 3. `vehicles-layout.component.ts`

Lógica de aviso basada en estado actual:

- `source()==='mock'` + sin token → mensaje actual (clave existente).
- `source()==='mock'` + `lastError()` presente:
  - `kind==='backend'` → clave nueva `account.vehicles.loadErrorBackend`
  - resto → clave nueva `account.vehicles.loadServerError`
  - + botón **Reintentar** → `load()` + refresco de estados remotos.
- Éxito remoto con lista vacía → solo empty-state existente, sin avisos.

### 4. i18n (×4 idiomas + `i18n:sync` + `i18n:excel`)

- `account.vehicles.loadErrorBackend`: "No se pudieron cargar tus matrículas
  (error del servicio). Se muestran las guardadas en este dispositivo."
- `account.vehicles.loadServerError`: "No se pudieron cargar tus matrículas
  (error inesperado del servidor). Se muestran las guardadas en este
  dispositivo."
- `account.vehicles.retry`: "Reintentar"

### 5. Unificación de la consulta de estado de aparcamiento

- Extender `OperationsService.loadParkingStatuses` para iterar los contratos
  conocidos (ciudad preferida primero, como hace hoy
  `ParkingSessionService.queryParkingStatus`) en lugar de `contractId = 0`.
- **Eliminar** `ParkingSessionService.queryParkingStatus` (duplicado) —
  `vehicles-layout` pasará a leer `_activeParkings` tras la sincronización.
- `vehicle-edit.ngOnInit`: refrescar el estado del vehículo antes de mostrar
  acciones, de modo que `remove()` decida con datos reales.
- El cartel de bloqueo ya existe (i18n ×4) — sin cambios.

### 6. Tests

- `ops-api-client.service.spec`: `getOrNull` con `value:null` → `null`;
  envelope error → lanza; HTTP 500 → lanza.
- `vehicle.service.spec`: éxito-null → remote+vacío; backend error →
  mock+`lastError('backend')`; HTTP 500 → mock+`lastError('http')`.
- Sincronización multi-contrato de aparcamientos activos.
- Bloqueo de borrado cuando el estado remoto indica aparcamiento activo.

## Verificación final

```
npx tsc --noEmit
npx ng test --watch=false --browsers=ChromeHeadless
npm run lint
npm run format && npm run format:check
npm run build
```

Prueba manual: cuenta conectada sin matrículas → empty-state sin cartel;
matrícula con aparcamiento activo remoto → borrado bloqueado con el cartel
existente.

## Hallazgos para backend (acciones externas)

1. `GET QueryUserPlatesAPI` devuelve `HTTP 500 {"Message":"Error."}` para
   usuarios válidos sin matrículas — debería devolver
   `{value:{plates:[]},isSuccess:true}` o equivalente.
2. Confirmar que `status === 2` es el valor correcto para "aparcado" en
   `QueryParkingStatusAPI`.
