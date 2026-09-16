# ArinPark · APK del 7 de septiembre de 2026

Comparación estática realizada el 7 de septiembre de 2026. La referencia anterior es `PANTALLAS_APK/androidApp-debug (2).apk`, la misma utilizada en `_apk-analysis-v2`. La nueva APK se encontró en `PANTALLAS_APK/androidApp-debug (4)_20260907.apk`; la ruta escrita en el encargo no existía con esa estructura de carpetas.

## Resultado

La principal novedad funcional es el tratamiento de las sanciones no pagables y su paso al histórico. También hay nuevas preferencias de notificación de soporte, ajustes de los temporizadores, correcciones de los enlaces legales del registro y actualización de operaciones al gestionar vehículos. Los estados `extension` y `refundable` ya estaban definidos como opciones independientes: la conversación facilitada aclara cómo debe aplicarlos la web.

## Identificación verificable

| Dato | APK anterior | APK 20260907 |
|---|---:|---:|
| Tamaño | 21.066.113 bytes | 21.097.189 bytes |
| Entradas de archivo | 1.359 | 1.360 |
| DEX | 34 | 34 |
| Archivos Java propios extraídos bajo `com/gertek` | 907 | 916 |
| versionCode / versionName | 1 / 1.0 | 1 / 1.0 |
| SDK mínimo / objetivo | 26 / 36 | 26 / 36 |

El paquete se mantiene: `com.gerteksa.r.c.mugipark`. Ambas compilaciones declaran `debuggable=true`. La versión declarada no permite distinguirlas; deben identificarse por fecha y SHA-256.

- Anterior: `077621bcb0f414389f0cb5f48101a0e6ab58fac9a087824d53703fe6cfb66cdc`.
- Nueva: `2fe06b41b4da02a0e628e3e68f1dc805fde2413210fd51f628c3bb7d056631d9`.

Comparación de archivos internos: **1 añadido, 0 eliminados, 210 modificados y 1.149 idénticos**. El único archivo añadido es `res/layout/item_historic_unpaid_fine_operation.xml`. Los recuentos Java corresponden a archivos reconstruidos, no a un recuento de clases DEX.

## Novedades confirmadas

### 1. Sanciones al histórico

- Nuevo caso de uso `MoveFineToHistoryUseCase` y nueva operación remota `UpdateFineStatusAPI`.
- La petición serializa `contractId` y `fineNumber`; utiliza POST con la sesión autorizada. El DTO Java llama a esos campos `cityId` y `fine`, pero sus nombres de transmisión son distintos.
- En el detalle de una sanción no pagable se ocultan el medio de pago, saldo, deslizador y descuento. Se explica si no es pagable o si terminó el plazo. Para `NOT_PAYABLE`, también se oculta la fecha de validez.
- Si la sanción todavía no está en el pasado, aparece «Entendido», que inicia el paso al histórico. Si ya es histórica, no vuelve a ofrecer esa acción.
- Nuevo elemento `HistoricUnpaidFine` en el listado de operaciones, con acceso al detalle. Se muestra como «Sanción» y no como un pago efectuado.
- El contador de sanciones del listado excluye las que ya tienen estado temporal `PAST`.
- El detalle de una sanción pagada pasa las coordenadas de la operación; antes enviaba unas coordenadas fijas.

Evidencia: `UnpaidFineDetailFragment.java`, `OperationsAdapter.java`, `OperationsFragment.java`, `GetOperationsGroupedUseCase.java`, `UpdateFineStatusRequestDto.java` y `FinePaymentApiImpl.java`.

### 2. Notificaciones de soporte

Se añaden interruptores de soporte tanto para notificaciones de la aplicación como por correo. El modelo incorpora `feedbackPushNotification` y `feedbackEmailNotification`; el DTO transmite `feedbackNotifications` y `emailFeedbackNotifications`. El guardado y la carga de la pantalla incluyen estos valores.

Evidencia: `NotificationsFragment.java`, `Notifications.java`, `NotificationsDto.java` y `fragment_notifications.xml`.

### 3. Temporizadores y presentación del aparcamiento

El contador de la pantalla de éxito tiene ahora en cuenta el inicio: antes de comenzar el intervalo muestra `fin − inicio`; una vez iniciado, muestra `fin − ahora`. El contador de operaciones incorpora igualmente el instante inicial. Esto evita que un intervalo futuro arranque mostrando más tiempo que su propia duración.

En el paso de selección de tiempo se elimina el acceso provisional al método de pago que solo mostraba un mensaje. Ante el error `-3`, la navegación vuelve al mapa existente mediante `popTo`, en lugar de añadir otra pantalla de mapa.

En la confirmación se elimina una llamada explícita a `loadPaymentMethods()` en `viewCreated`; esto es un ajuste del ciclo de carga, no evidencia de un nuevo sistema de cobro.

Evidencia: `ParkSuccessFragment.java`, `OperationsAdapter$LiveOperationViewHolder$startCountdown$1$1.java`, `TimeStepsFragment.java` y `ParkConfirmFragment.java`. Se conserva una extracción en modo simple para revisar instrucciones que JADX no reconstruyó correctamente.

### 4. Registro, soporte y vehículos

- Registro: los textos legales incluyen delimitadores de negrita, que se convierten a etiquetas `<b>` para la interacción de los enlaces de privacidad y condiciones.
- Soporte: se añaden textos localizados de agradecimiento, confirmación de recepción y botón «Entendido». La pantalla `SupportSuccessFragment` ya existía; no se presenta como una pantalla nueva de esta versión.
- Vehículos: las acciones de añadir y eliminar matrícula incorporan llamadas a actualizar las operaciones.
- Login: el estado `userEmail` se renombra a `savedEmail`. No se interpreta el cambio de nombre como una funcionalidad nueva por sí solo.

En el catálogo base y en español hay **8 claves de texto nuevas y 2 modificadas**. El CSV de cadenas conserva sus valores anteriores y nuevos.

## Reglas de operaciones y su aplicación en la web

| Propiedad | 0 | 1 | 2 |
|---|---|---|---|
| `refundable` | Ocultar Desaparcar | Mostrar deshabilitado | Mostrar habilitado |
| `extension` | Ocultar Ampliar tiempo | Mostrar deshabilitado | Mostrar habilitado |

Son independientes. Por ejemplo, `refundable=0` y `extension=2` permite mostrar únicamente Ampliar tiempo. No se deben deducir ambos permisos del tipo de tarifa ni de una misma propiedad.

Las ampliaciones sucesivas parten de la operación de ampliación vigente. La web ya combina las operaciones activas por matrícula, contrato y sector tomando los datos más recientes; ahora conserva también el valor completo de `extension` para no perder la diferencia entre oculto y deshabilitado.

El indicador de navegación web se unificó para móvil y escritorio: aparcamientos y extensiones con `timePeriod=2`, más sanciones con `fineStatus=1`. No cuenta las sanciones no pagables ni las vencidas.

**Matiz encontrado en la APK:** `GetLiveOperationsSizeUseCase` usa «distinto de PAST» para aparcamientos y extensiones, por lo que también puede incluir operaciones futuras. La web mantiene el criterio de operaciones activas solicitado, `timePeriod=2`. Si se quiere reproducir literalmente el tratamiento móvil de las futuras, este punto requiere una decisión de producto; no se ha ampliado el contador silenciosamente.

Evidencia verificable: `evidence/OperationsAdapter.java`, aproximadamente líneas 410–436, y `evidence/GetLiveOperationsSizeUseCase.java`, aproximadamente líneas 79–103. Los enum se encuentran bajo `sources/com/gertek/urbanoa/user/domain/model/`.

## Ajustes web realizados en este encargo

- El enlace inferior se llama **Gestionar monedero** y abre un diálogo de una columna.
- Se reutiliza la gestión de cuenta: tarjetas, principal, eliminación con confirmación, añadir tarjeta, recarga y devolución. Las vistas interiores se recorren dentro del diálogo.
- El modal conserva la confirmación del aparcamiento. El saldo y las tarjetas usan el mismo servicio compartido, por lo que el resumen responde a sus cambios.
- Se unifican los dos bloques de método de pago. El saldo disponible, su prioridad y el desglose se presentan bajo un único encabezado.
- Sin tarjeta y con saldo insuficiente se muestra una indicación para añadir tarjeta o recargar. No se dibuja una tarjeta vacía ni una fecha de caducidad inexistente. Al intentar pagar se muestra el aviso de la APK y se ofrece abrir los métodos de pago.
- El icono «i» junto al municipio abre la información del municipio con imagen y datos de contacto (dirección, teléfono y correo).
- Se corrigen los estados independientes de los botones y el contador de navegación. Las acciones también comprueban los permisos antes de continuar.

La causa del mensaje engañoso era un objeto de tarjeta vacío utilizado como alternativa cuando no existía ninguna. El componente de resumen lo representaba como si fuera una tarjeta real.

## Compatibilidad y trabajo posterior derivado del análisis

| Hallazgo de la APK | Situación web observada |
|---|---|
| Estados de ampliar/desaparcar | Corregidos en este encargo |
| Contador de navegación | Unificado con sanciones pagables |
| Sanciones al histórico | Incorporadas: se muestran sanciones no pagables y el botón «Entendido» las mueve mediante `UpdateFineStatusAPI` |
| Notificaciones de soporte | Incorporados los interruptores de respuestas de soporte para aplicación y correo |
| Información del municipio | Incorporada desde el control de municipio |
| Aviso sin saldo ni método válido | Incorporado en la confirmación de aparcamiento |
| Temporizador antes del inicio | Incorporado: el contador comienza en `max(ahora, inicio)` |
| Coordenadas de sanción pagada y actualización por matrícula | Las coordenadas ya se conservan; las operaciones se recargan al añadir, editar o eliminar vehículos |

Las novedades funcionales identificadas se han incorporado a los flujos equivalentes de la web. El cambio de nombre interno de `userEmail` no requiere adaptación visible.

## Verificación y límites

- **44 pruebas automatizadas aprobadas**: resumen sin tarjeta, las nueve combinaciones de permisos, contador, operaciones, confirmación y desaparcar, entre otras pruebas existentes seleccionadas.
- **Compilación de producción aprobada**. Mantiene advertencias de tamaño de estilos en mapa, asistente y operaciones.
- **ESLint aprobado** en los archivos TypeScript modificados.
- **Paridad de idiomas y claves utilizadas aprobada**, sin claves faltantes.
- `npm run i18n:check` no pudo completarse: falta `docs/traducciones_agrupadas_urbanoa.xlsx`. Su regeneración se detiene por 80 claves sin uso respaldado. No se eliminaron esas traducciones para hacer pasar la auditoría.
- Revisión visual con navegador a **1440×900 y 390×844**. Las respuestas de servicios utilizadas para esta revisión fueron simuladas y las mutaciones remotas estuvieron interceptadas. No equivale a una prueba bancaria real de Paycomet/3DS.
- Análisis APK estático con JADX 1.5.5. La extracción completa terminó con errores de reconstrucción en algunos métodos; se guardó el registro y se extrajeron instrucciones simples para los puntos críticos. El Java reconstruido no es el Kotlin original ni código ejecutable validado.
- No se ejecutó la APK en un dispositivo ni se hicieron pagos reales.

## Material preparado

En el proyecto, `_apk-analysis-v3/` contiene los recursos, fuentes reconstruidas, evidencias e inventarios. Los análisis anteriores permanecen intactos.

- `inventory/summary.json`: tamaños, hashes y recuentos.
- `inventory/diff-v2-v3.csv`: comparación exacta de archivos internos.
- `inventory/app-source-diff.csv`: archivos Java propios añadidos/modificados.
- `inventory/strings-values*.csv`: diferencias de textos por idioma.
- `inventory/endpoints-v2.txt` y `endpoints-v3.txt`: inventario de nombres de endpoints.
- `inventory/normalized-diffs/`: diferencias auxiliares de código; pueden conservar renumeraciones generadas por el descompilador y no deben confundirse automáticamente con cambios funcionales.
- `evidence/`: extracción de instrucciones para botones y contador.
- `decompilation.log`: incidencias de la extracción completa.

El paquete de entrega incluye este informe, los inventarios y una selección de evidencias para consultar la comparación sin redistribuir toda la APK ni sus dependencias.
