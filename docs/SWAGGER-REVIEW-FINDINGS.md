# Swagger review — histórico archivado

> Este documento conserva el histórico de comprobaciones anteriores. Para el
> estado vigente del contrato y de la migración consultar
> [`SWAGGER-REVIEW-CURRENT.md`](./SWAGGER-REVIEW-CURRENT.md).

Hallazgos al comparar el código actual contra el Swagger publicado en
`http://185.76.212.27/OPSWebServicesAPI/swagger/ui/index` (spec crudo en
`http://185.76.212.27/OPSWebServicesAPI/swagger/docs/v1`, título interno
`"OPSWebServicesAPI"`, versión `v1`).

Este documento es una lista de trabajo para ir resolviendo paso a paso. Cada
punto tiene un estado. Nada de esto se ha aplicado al código todavía salvo lo
que se marque explícitamente como `RESUELTO`.

Cómo actualizar el spec si el backend cambia:

```
curl http://185.76.212.27/OPSWebServicesAPI/swagger/docs/v1
```

## 1. `/OPSWebServicesAPI` vs `/OPSWebServicesAPI3` — RESUELTO

**Pregunta:** el swagger solo documenta rutas bajo `/OPSWebServicesAPI3/...`,
pero toda la app (y todas las pruebas manuales hechas hasta ahora) usan
`/OPSWebServicesAPI/...` (sin el "3"). ¿Son APIs distintas? ¿Hay que migrar?

**Evidencia recogida (2026-08-20):**

- `/OPSWebServicesAPI/swagger/docs/v1` y `/OPSWebServicesAPI2/swagger/docs/v1`
  devuelven 404 — solo la ruta con "3" tiene Swagger activado.
- Comparación directa, mismos parámetros, contra los dos hosts:
  - `QueryContractsAPI` (GET): mismo payload byte a byte, salvo un campo
    `time` (timestamp de la petición) — la única diferencia es el reloj de
    ejecución, no los datos.
  - `QuerySectorsAPI` (POST, `{contractId:1}`): **idéntico byte a byte**.
  - `QueryStreetsAPI` (POST, `{contractId:1}`): **idéntico byte a byte**.
  - Cabeceras HTTP (`Server: Microsoft-IIS/10.0`, `X-AspNet-Version`,
    `Content-Length`) idénticas en ambos hosts.
- El título del swagger es literalmente `"OPSWebServicesAPI"` (sin "3").

**Segunda ronda de pruebas (2026-08-20), con login y register reales — no solo
lectura:**

- Login con una credencial ya usada anteriormente
  (`urbanoa_test_9749@emalupe.com`): el mismo body, contra los dos hosts,
  devuelve el mismo error (`-23`, "Contraseña inválida") en ambos — la
  contraseña de esa cuenta cambió en pruebas anteriores de esta conversación,
  no es una diferencia entre hosts.
- **Registré una cuenta nueva de prueba directamente contra
  `/OPSWebServicesAPI3/RegisterUserAPI`** (`urbanoa_claude_test_*@emalupe.com`)
  → éxito, `value` con un ID numérico, igual que el contrato conocido.
- **Login inmediato con esa cuenta (sin activar) contra los dos hosts**: los
  dos devuelven exactamente `-29` ("Validación requerida") — la cuenta creada
  en API3 es visible y se comporta igual desde API (sin "3").
- **Volví a registrar el mismo email, esta vez contra `/OPSWebServicesAPI/`
  (sin "3")**: devuelve `-21` ("El nombre del usuario ya se ha registrado") —
  o sea, el registro hecho en API3 bloquea el registro duplicado visto desde
  API. Estado compartido en tiempo real, en ambas direcciones.

**Conclusión:** ya no es solo "los datos de lectura coinciden" — el register
hecho en un host es visible instantáneamente desde el otro para login y para
la detección de duplicados. `/OPSWebServicesAPI` y `/OPSWebServicesAPI3` son
el mismo backend, misma base de datos, en tiempo real. No hay ningún riesgo
funcional en seguir usando cualquiera de los dos.

**Recomendación:** dado que es indiferente a nivel funcional, y que
`OPSWebServicesAPI3` es la única ruta con documentación pública (Swagger)
—útil para mantenimiento futuro, onboarding de otros devs, y como contrato de
referencia—, mi sugerencia es migrar `opsApiBaseUrl` a
`/OPSWebServicesAPI3/` cuando el usuario lo autorice. No es urgente (cero
riesgo de que algo se rompa por quedarnos como estamos), pero sí evita que en
el futuro alguien tenga que redescubrir esta equivalencia. Si el contacto de
backend confirma que `OPSWebServicesAPI` (sin "3") es la ruta que
piensan mantener a largo plazo, no migrar.

**Aplicado (2026-08-20):** migrado. Cambiado el prefijo de ruta en los dos
sitios donde estaba fijo en el código:

- `src/app/core/http/api-client.ts` — `buildUrl()` (usado por `AuthService` y
  `PasswordService`: login, registro, recuperar/cambiar contraseña).
- `src/app/core/api/ops-endpoints.ts` — `API_PREFIX` (usado por
  `OpsApiClient`, es decir, el resto de servicios: wallet, vehículos,
  ciudades, calles, notificaciones, parking, soporte...).

Actualizadas también las 6 specs que comprobaban la URL literal
(`notifications`, `parking-api`, `password`, `streets`, `vehicle`,
`wallet` — `*.service.spec.ts`) para que esperen `OPSWebServicesAPI3/...` en
vez de `OPSWebServicesAPI/...`.

`environment.opsApiBaseUrl` (`/ops-api`, proxiado a `185.76.212.27`) no
cambió — solo el segmento de ruta que se le añade después.

**Verificado:** `tsc --noEmit` (app y specs), 37/37 tests, `npm run build`,
`npm run lint` y `npm run format:check`, todos limpios.

**Estado:** `RESUELTO`.

---

## 2. `ChangePasswordAPI` — el campo de la contraseña nueva se llama `password`, no `newPassword` — RESUELTO

**Prioridad: alta.** Es la causa más probable de que "olvidé mi contraseña"
no esté cambiando la contraseña de verdad hoy.

**Contrato según swagger** (`POST /ChangePasswordAPI`), obligatorios:

```json
{
  "contractId": 0,
  "userName": "...",
  "email": "...",
  "password": "... (*) Password to change",
  "recode": "..."
}
```

**Lo que manda el código hoy** (`PasswordService.confirmPasswordReset` en
`src/app/core/services/password.service.ts`):

```ts
{ email, newPassword, recode: code }
```

- Falta `contractId` y `userName`.
- El campo con la contraseña nueva se llama `password` en el contrato real,
  no `newPassword` — así que hoy ese valor se está mandando bajo una clave
  que el backend no reconoce y probablemente se ignora en silencio.

**Por qué esto explica la ambigüedad de las pruebas manuales:** en la prueba
que confirmó el endpoint, el campo `password` llevaba el valor
`"12345678"` — que era la contraseña **que la cuenta ya tenía**. Si `password`
es de verdad "la nueva", lo que probablemente ocurrió es que la contraseña se
"cambió" a la misma que ya tenía, sin que se llegara a probar el login con el
valor que se creía que era la nueva contraseña (`"87654321"`, mandado como
`newPassword`, campo que el backend no conoce).

**Aplicado (2026-08-20).** `PasswordService.confirmPasswordReset()` ahora
manda `{ contractId: 0, userName: email, email, password: newPassword,
recode: code }` — campo `password` en vez de `newPassword`, y `contractId` +
`userName` incluidos igual que en el resto de llamadas de este flujo.

Este cambio fue de la mano del punto 4 (`VerifyRecoveryPasswordAPI`) — ver
abajo, ya que ahora `confirmPasswordReset()` primero verifica el código y
luego cambia la contraseña.

**Verificado:** `tsc --noEmit`, 38/38 tests (con un test nuevo que cubre
específicamente el orden verify→change y el nombre de los campos), build,
lint y format, todos limpios. No se ha podido probar con un código de
recuperación real de extremo a extremo (necesitaría acceso a la bandeja de
entrada de una cuenta activada) — si algo falla en producción con esta
llamada, revisar primero si `contractId`/`userName` importan de verdad para
este endpoint en concreto.

**Estado:** `RESUELTO`.

---

## 3. `CancelUserAccountAPI` — método HTTP incorrecto — RESUELTO

**Prioridad: media.**

**Swagger:** `GET /CancelUserAccountAPI`, sin parámetros de body (solo el
token de sesión, vía `Authorization: Bearer`).

**Código anterior** (`AuthService.cancelAccount` en `auth.service.ts`):

```ts
await postJson('/CancelUserAccountAPI', { password, reason }, { token: this.token() });
```

Usaba `POST` con un body `{password, reason}` que el swagger no contempla en
absoluto para este endpoint.

**Aplicado (2026-08-20).** `AuthService.cancelAccount()` ahora hace
`GET /CancelUserAccountAPI` solo con el token de sesión, sin body, tal como
documenta el swagger:

```ts
async cancelAccount(): Promise<void> {
  await getJson('/CancelUserAccountAPI', { token: this.token() });
  this.clearSession();
}
```

**Decisión de diseño sobre la pantalla** (`delete-account.component.ts`): el
campo de "contraseña" **se mantiene en el formulario** como paso de
confirmación antes de permitir enviar una acción destructiva e irreversible
— pero ya no se manda a ningún sitio, porque el endpoint no lo acepta. A
diferencia del "cambiar contraseña actual" (que sí quité del todo en su
momento, porque ahí no aportaba nada), aquí lo dejo como fricción deliberada
para evitar un borrado accidental, aunque el servidor no lo verifique. Si
prefieres quitarlo del todo o cambiarlo por otro tipo de confirmación (p.ej.
escribir "ELIMINAR"), dímelo y lo ajusto.

También se quitó el mapeo `unauthorized: 'account.deleteAccount.wrongPassword'`
del manejo de errores — ya no tiene sentido, porque el servidor nunca
verifica la contraseña escrita; si aparece `unauthorized` ahora solo puede
significar que el token de sesión en sí no es válido, así que cae al mensaje
genérico. Se eliminó la clave de idioma `account.deleteAccount.wrongPassword`
en los 4 idiomas por quedar huérfana.

**No probado en real** — sigue siendo una operación destructiva e
irreversible; no se ha ejecutado contra ninguna cuenta (ni siquiera la de
prueba creada para el punto 1/4, para no perder esa cuenta antes de que haga
falta para más pruebas).

**Verificado:** `tsc --noEmit`, 38/38 tests, build, lint, format e i18n,
todos limpios.

**Estado:** `RESUELTO` (contrato del cliente corregido; sin verificación end-to-end contra el backend real).

---

## 4. `VerifyRecoveryPasswordAPI` — endpoint no usado, podría faltar en el flujo — RESUELTO

**Prioridad: media.**

El swagger documenta un endpoint dedicado a verificar el código de
recuperación **antes** de cambiar la contraseña:

```
POST /VerifyRecoveryPasswordAPI
{ contractId*, userName*, email*, recode* }
```

Hoy el flujo de "olvidé mi contraseña" va directo de `RecoverPasswordAPI`
(pide el código) a `ChangePasswordAPI` (cambia la contraseña), sin verificar
el código en un paso intermedio. La pantalla `reset-password-code`
(`src/app/features/auth/reset-password-code/`) hoy es puramente informativa
— no valida nada, solo permite reenviar el correo.

**Decisión (2026-08-20):** sí, llamarlo. Se integra dentro de
`PasswordService.confirmPasswordReset()` (llamado desde la pantalla
`reset-password-confirm`, que es donde el usuario ya escribe el código junto
con la contraseña nueva) — no se tocaron las pantallas 2 y 3 en sí, solo el
servicio: ahora hace `VerifyRecoveryPasswordAPI` primero y, solo si va bien,
`ChangePasswordAPI` después. Si el código está mal, `VerifyRecoveryPasswordAPI`
falla antes de llegar a cambiar nada, y el error se propaga igual que
cualquier otro (la pantalla ya tenía el manejo de error preparado).

**Bonus encontrado al probarlo en real:** con un código incorrecto, el
backend devuelve `error.code: -31` ("Recovery code not found" /
"Código de recuperación no encontrado"). Se añadió el mapeo `-31 →
'invalidCode'` en `codeForServerError()` (`api-client.ts`) — esto además
revive un mapeo que llevaba toda la conversación muerto:
`reset-password-confirm.component.ts` ya tenía
`apiErrorKey(error, { invalidCode: 'auth.newPassword.invalidCode' })`, pero
como ningún código de servidor se mapeaba nunca a `invalidCode`, ese mensaje
específico jamás se mostraba. Ahora sí.

**Verificado:** probado en real contra el backend con un código incorrecto
a propósito (cuenta de prueba `urbanoa_claude_test_*`), confirmando que el
endpoint acepta el body y devuelve `-31` tal como se documentó aquí. `tsc
--noEmit`, 38/38 tests, build, lint y format, todos limpios.

**Estado:** `RESUELTO`.

---

## 5. `RegisterUserAPI.plates` — formato distinto al documentado (sin acción recomendada)

**Prioridad: informativa, no accionable sin más pruebas.**

**Swagger:** `plates` es un array de objetos `{ plate: string, favorite: int }`.

**Código actual:** `plates: string[]` (ej. `["BCD+0000"]"`), confirmado
funcionando en pruebas manuales reales contra el backend.

Como ya está verificado empíricamente que el formato de strings funciona, no
se recomienda cambiarlo a ciegas solo por seguir el swagger al pie de la
letra — probablemente el swagger esté desactualizado en este punto, o el
backend acepte ambos formatos.

**Estado:** sin acción, solo documentado para referencia futura.

---

## 6. Campos marcados "obligatorios" en swagger que hoy no se envían

**Prioridad: baja / informativa.**

- `LoginUserAPI`: swagger marca `contractId` como obligatorio; no se envía y
  el login funciona igual (confirmado en pruebas reales).
- `RecoverPasswordAPI` / `ResendMailAPI`: swagger marca `contractId` y
  `userName` como obligatorios; solo se envía `email` en `RecoverPasswordAPI`
  y funciona igual.

Es habitual que los generadores de Swagger para .NET marquen como
"required" cualquier campo no-nullable (`int`, no `int?`) aunque el servidor
tolere el valor por defecto (0). No se recomienda ninguna acción salvo que
empiece a fallar algo.

**Estado:** sin acción.

---

## 7. `UpdateUserAPI` — declarado pero no implementado — RESUELTO

**Prioridad: informativa.**

`OPS_ENDPOINTS.user.update` apunta a `UpdateUserAPI`, pero ningún servicio lo
llama todavía. No es un bug — probablemente es para cuando se implemente la
edición de perfil (`account/profile`). El swagger documenta el body completo
si hace falta implementarlo más adelante (nombre, apellidos, dirección,
teléfono, NIF...).

**Aplicado (2026-08-24).** Implementado como parte del trabajo de
Cuenta/Perfiles y Datos fiscales — ver puntos 9 y 10 abajo.

**Estado:** `RESUELTO`.

---

## 8. Endpoints de matrículas (`QueryUserPlatesAPI`, `AddUserPlateAPI`, `UpdateUserPlateAPI`, `RemoveUserPlateAPI`) — RESUELTO

**Prioridad: alta** (bug real encontrado). Revisado el 2026-08-21 a partir de
una lista que dio el usuario (que resultó no coincidir con el swagger real —
mencionaba `brand`, `model`, `isDefault`, `plateId`, `id`, ninguno de los
cuales existe en el contrato real).

**Contrato real según swagger** (spec re-descargado el 2026-08-21):

```
GET  QueryUserPlatesAPI   → { value: { plates: [{ plate: string, favorite: int32 }] } }
POST AddUserPlateAPI      → body { plate: string, favorite?: int32 }   → value: string
POST UpdateUserPlateAPI   → body { plate: string, favorite?: int32 }   → value: string
POST RemoveUserPlateAPI   → body { plate: string, favorite?: int32 }   → value: string
```

Los 4 comparten el mismo shape reducido: solo `plate` + `favorite` (entero).
No existe `plateId` ni `id` — la matrícula (string) es el identificador en
las tres mutaciones.

**Bug encontrado:** `VehicleService` (`src/app/core/services/vehicle.service.ts`)
llama a `UpdateUserPlateAPI` para marcar una matrícula como favorita/por
defecto, pero **nunca manda el campo `favorite`**:

```ts
// add(), línea ~65
if (result.success && input.isDefault) await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate });

// update(), línea ~84
if (result.success && changes.isDefault) result = await this.remoteMutation(OPS_ENDPOINTS.user.updatePlate, { plate });
```

Ambas llamadas mandan `{ plate }` a secas. La intención es "marca esto como
favorito", pero el único campo que le dice eso al backend nunca se envía. El
estado local (lo que ve el usuario en `vehicle-add`/`vehicle-edit`, que leen
`favorite`/`isDefault` de un signal en el componente) se actualiza igual,
así que la app *parece* funcionar, pero probablemente el backend nunca
recibe la marca de favorito — divergencia entre lo que ve el usuario y lo
que hay guardado en el servidor.

**Menor, de tipado:** `PlateApiItem.favorite` está declarado como `boolean`
en `vehicle.service.ts`; el swagger dice `int32` (0/1). No rompe nada en
runtime (JS trata 0/1 como falsy/truthy en los usos actuales), pero el tipo
no refleja lo que realmente devuelve el backend.

**Lo que sí coincide:** `AddUserPlateAPI`/`RemoveUserPlateAPI` mandan
exactamente `{ plate }` (válido, `favorite` es opcional en ambos). El flujo
de "cambiar de matrícula" (borrar la vieja + añadir la nueva) también encaja
con el contrato.

**Aplicado (2026-08-21).** Confirmado por swagger que `UpdateUserPlateAPI` no
puede renombrar una matrícula (solo `plate`+`favorite`, sin campo para "valor
nuevo") — el enfoque actual de borrar+añadir para cambiar de matrícula es el
único posible con este contrato y no se ha tocado.

Cambios en `src/app/core/services/vehicle.service.ts`:
- Nuevo método `setDefault(id)`: manda `updatePlate({plate, favorite: 1})`
  para la nueva matrícula favorita y, si había otra distinta marcada antes,
  `updatePlate({plate: anterior, favorite: 0})` para desmarcarla en el
  servidor — antes esa desmarcación solo pasaba en el estado local, nunca se
  avisaba al backend.
- `add()`/`update()` ahora delegan el marcado de favorito en `setDefault()`
  en vez de la llamada inline que tenía el bug.
- `remoteMutation()` amplía su tipo de body a `{ plate, favorite?: number }`.

También, a petición del usuario:
- `vehicle-add.component.ts`: ahora comprueba `mutation.success` antes de
  marcar éxito, igual que `vehicle-edit.component.ts` (cambio estructural;
  `success` es siempre `true` hoy en la arquitectura mock-first del proyecto,
  así que esto no cambia el comportamiento visible, solo deja el código listo
  si esa semántica se ajusta más adelante).
- `vehicles-layout.component.ts`: nueva acción rápida de "marcar como
  favorita" en la lista (icono de estrella, `LucideStar`), sin tener que
  entrar a editar. Cada fila pasó de ser un único `<a>` a un `<li>` con el
  enlace de edición y el botón de favorito como hermanos (anidar `<button>`
  dentro de `<a>` es HTML inválido). Nuevas claves de idioma
  `account.vehicles.markFavorite`/`.currentFavorite` en los 4 idiomas.

**Aplicado también (2026-08-21, a petición del usuario): `remove()`.** Tenía
el mismo tipo de bug en un tercer sitio — al borrar la matrícula favorita,
promovía otra como favorita solo en el estado local, sin avisar nunca al
backend. Ahora, tras borrar, si no queda ninguna matrícula marcada como
favorita entre las que quedan, llama a `setDefault()` sobre la primera
restante — que manda `updatePlate({plate, favorite: 1})` de verdad. Como la
matrícula borrada ya no está en el estado en ese momento, `setDefault()` no
intenta desmarcar nada más (no hay "anterior favorita" que limpiar, se borró
junto con la matrícula).

**Verificado:** `tsc --noEmit` (app y specs), **41/41 tests** (4 nuevos en
total: la secuencia completa de llamadas al marcar favorito con desmarcación
de la anterior, que `setDefault()` no hace ninguna llamada si ya es
favorita, la promoción remota al borrar la favorita, y que borrar una
matrícula no favorita no dispara ninguna promoción), build, lint, format e
i18n, todos limpios. No probado en vivo contra el backend real (necesitaría
una cuenta activada con al menos dos matrículas).

**Estado:** `RESUELTO`.

---

## 9. `LoginUserAPI` — no devuelve datos de usuario — RESUELTO

**Prioridad: alta.** Verificado en vivo el 2026-08-24 con la cuenta de prueba
`alcolla000419@gmail.com`.

**Swagger/real:** la respuesta de `LoginUserAPI` es solo
`{ token: string, firstLogin: int }` — **no** incluye un objeto `user`. El
código anterior (`normalizeSession` en `auth.service.ts`) intentaba leer
`name`/`surname`/`phone` del payload del login, que nunca llegan, así que el
perfil quedaba vacío tras login.

**Contrato correcto para hidratar el perfil:** `GET /QueryUserAPI`
(con `Authorization: Bearer`) devuelve el schema `User` completo. Shape real
confirmado:

```
names, firstSurname, secondSurname, email, userName, nif,
mainMobilePhone, alternativeMobilePhone,
addressStreetName, addressBuildingNumber, addressCity,
addressProvince, addressPostalCode, addressCountry,
addressDepartmentFloor, addressDepartmentDoor,
addressDepartmentStair, addressLetterNumber,
contractId, validateConditions, firstLogin, ...
```

Ojo: la letra de la dirección es `addressLetterNumber` (no
`addressDepartmentLetter`, como sugiere el patrón del resto).

**Aplicado (2026-08-24):**
- `AuthService.login()` ahora hace `QueryUserAPI` tras guardar la sesión y
  hidrata `UserService` con la respuesta (con try/catch silencioso).
- `normalizeProfileUser()` mapea los nombres reales (`names`,
  `firstSurname`, `mainMobilePhone`, campos `address*`), conservando fallbacks
  a los nombres antiguos por si el backend cambia.
- El perfil también se recarga al entrar en la sección Cuenta
  (`AccountShellComponent.ngOnInit`).

**Verificado:** probado en vivo contra el backend; 45/45 tests.

**Estado:** `RESUELTO`.

---

## 10. `UpdateUserAPI` — verificado en vivo; `password*` NO es obligatorio — RESUELTO

**Prioridad: alta.** Verificado en vivo el 2026-08-24 con la misma cuenta.

**Swagger marca como requeridos:** `email*`, `firstSurname*`, `names*`,
`password*`. En la práctica:

- Un POST **sin `password`** con el resto de campos vacíos devuelve éxito
  (`value: "194063"` = ID de usuario). Es otro falso-obligatorio del
  generador de Swagger (.NET), igual que `contractId` en otros endpoints.
- Escrito y releído un valor en cada campo de perfil y dirección fiscal:
  **todos persisten**. Detalle: el backend normaliza los nombres a inicial
  mayúscula ("TestName" → "Testname").

**Body verificado que funciona** (además de lo documentado, se envían
`cloudToken`, `appVersion`, `operatingSystem`; sin `password`):

```
contractId, userName (= email), names, firstSurname, secondSurname,
email, nif, mainMobilePhone, alternativeMobilePhone,
addressStreetName, addressBuildingNumber, addressCity, addressProvince,
addressPostalCode, addressCountry, addressDepartmentFloor,
addressDepartmentDoor, addressDepartmentStair, addressLetterNumber
```

**Aplicado (2026-08-24) — integración de Perfil y Datos fiscales:**

- `UserData` ampliado con `secondSurname` y `address` (objeto `UserAddress`
  con street/number/floor/door/stair/letter/city/province/postalCode/country),
  según el schema del swagger.
- `UserService` ahora sigue el patrón mock-first (como `VehicleService`):
  - `load()` → `GET QueryUserAPI` cuando hay token; localStorage como cache.
  - `save(changes)` → `POST UpdateUserAPI` con el body mapeado arriba; solo
    mergea localmente si el remoto tiene éxito. Sin token, guarda local
    (`source: 'mock'`), igual que el resto de servicios.
  - `updateLocal()` reemplaza al antiguo `updateUser()` (lo usaba
    `AuthService` al almacenar la sesión).
- `profile.component.ts`: guardado real vía `UserService.save()`, campo nuevo
  de segundo apellido, modal de error si falla el guardado; eliminado el
  `setTimeout` + `Object.assign(MOCK_USER)` heredado del mock.
- `tax-data.component.ts`: antes era un stub sin persistencia; ahora carga
  desde `UserService` y guarda vía API. La dirección usa los 4 subcampos del
  schema (piso/puerta/escalera/letra) en lugar de un único "floor".
- Claves i18n nuevas en los 4 idiomas: `account.profile.secondSurname`,
  `account.profile.saveError(+Detail)`, `account.taxData.door/stair/letter`,
  `account.taxData.saveError(+Detail)`.

**Verificado:** round-trip en vivo contra el backend (escritura + lectura +
restauración de la cuenta a su estado original). `tsc --noEmit`, 45/45 tests
(5 nuevos: mapeo de `QueryUserAPI`, no-token mock-first, body de
`UpdateUserAPI`, no-merge en error, más el ajuste del spec de
`PasswordService` que ahora contempla la llamada extra de perfil post-login).

**Estado:** `RESUELTO`.

---

## 11. Endpoints referenciados en `ops-endpoints.ts` — verificación actualizada

La comprobación del 2026-08-31 contra el Swagger actual confirma que todos
los endpoints declarados en `OPS_ENDPOINTS` aparecen en el spec publicado.

No queda ninguna ruta en código sin correspondencia en Swagger. El informe
antiguo indicaba lo contrario porque se había comparado contra una versión
anterior del documento.

**Estado:** `RESUELTO`.

---

## 12. Endpoints del swagger aún sin integrar (informativo)

Levantado el 2026-08-24. Disponibles en el swagger y sin uso en la app hoy:

- Parking alternativos: `QueryParkingOperationWithMoneyStepsAPI`,
  `QueryParkingOperationForTimeAPI`, `QueryParkingOperationForMoneyAPI`
- Zonas/plazas: `QueryZoneAPI`, `QueryPlaceAPI`
- Multas: `UpdateFineStatusAPI`

No requieren acción inmediata; referencia para futuras funcionalidades.

**Estado:** sin acción.

---

## 13. Prefijo `/OPSWebServicesAPI` — cierre definitivo

Este apartado sustituye el historial anterior sobre `/OPSWebServicesAPI3`.
El Swagger actualmente publicado y el backend consumido por la aplicación
usan `/OPSWebServicesAPI`. El frontend mantiene el prefijo lógico
`/ops-api/OPSWebServicesAPI/` y el proxy solo elimina `/ops-api`; no existe ya
una regla de compatibilidad para `OPSWebServicesLegacyAPI`.

**Fecha: 2026-08-25.** Historial completo del tira-y-afloja:

1. Punto 1: se canonicalizó `OPSWebServicesAPI3/` en el código por ser la
   ruta con Swagger (ambas rutas son el mismo backend, verificado).
2. El merge de `feature/integration-api` revirtió a `OPSWebServicesAPI/`
   (sin "3") de forma sistemática — código, specs, **y también la
   infraestructura**: `proxy.conf.js` y `deploy/nginx.conf.template`
   reescriben `^/ops-api/OPSWebServicesAPI/(.*)$ → /OPSWebServicesAPI3/$1`.
3. Se restauró el "3" en el código creyendo que el revert era un accidente
   → **bug real**: la petición salía como
   `/ops-api/OPSWebServicesAPI3/LoginUserAPI`, el rewrite del proxy
   coincidía con el prefijo y el backend recibía
   **`/OPSWebServicesAPI33/LoginUserAPI`** → 404 de IIS en el login.

**Conclusión:** el prefijo sin "3" es deliberado y forma parte de la
arquitectura de despliegue. La app habla siempre con
`/ops-api/OPSWebServicesAPI/<Endpoint>`; la reescritura a `/OPSWebServicesAPI3/`
vive exclusivamente en la infraestructura (proxy dev + nginx). El Swagger
bajo API3 sigue siendo la referencia documental, no una ruta que consuma la
aplicación directamente.

**Aplicado:** `ops-endpoints.ts` vuelve a `'OPSWebServicesAPI/'` y los 8
archivos de specs a los literales sin "3". Verificado en vivo: login OK con
el flujo completo (payload real del usuario contra la ruta reescrita).

**Regla para el futuro: NO cambiar el prefijo en el código.** Si algún día
el backend unifica rutas, tocar `proxy.conf.js`, `nginx.conf.template` y
este documento a la vez.

**Estado:** `RESUELTO`.

---

## 14. Verificaciones en vivo de los flujos auth (2026-08-25)

Probado contra el backend real con la cuenta de prueba:

1. **`LoginUserAPI` con `cloudToken: ''`**: aceptado (`isSuccess: true`).
   Aun así, se restaura el envío de un UUID de dispositivo persistido
   (`urbanoa.deviceToken`) por higiene y trazabilidad.
2. **`ChangePasswordAPI` con `recode` erróneo devuelve `-31`**
   ("Código de recuperación no encontrado") igual que
   `VerifyRecoveryPasswordAPI`. Consecuencia: NO hace falta restaurar el paso
   Verify→Change que se perdió en el merge — la llamada directa a
   `ChangePasswordAPI` ya propaga el error correcto y el mapping
   `-31 → invalidCode → auth.newPassword.invalidCode` funciona.

**Arreglos aplicados en esta ronda:**

- `AccountApiService.cancelAccount()`: volvía a tragarse los errores
  (fallback mock), lo que hacía que la baja de cuenta mostrase éxito aunque
  la API fallase. Ahora propaga el error y `delete-account.component` muestra
  el mensaje correspondiente vía `apiErrorKey`.
- `AuthService.loginRequest()`: `cloudToken` con UUID de dispositivo en vez
  de cadena vacía.
- Logout duplicado eliminado: `authService.logout()` ya navega a
  `/auth/login`; quitada la segunda navegación en `account-shell`.

**Verificado:** 54/54 tests, lint, prettier y build limpios.

**Estado:** `RESUELTO`.
