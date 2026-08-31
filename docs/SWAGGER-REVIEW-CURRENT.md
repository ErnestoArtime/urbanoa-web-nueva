# Estado actual de la migración OPS

Última revisión: 2026-08-31.

## Referencia

- [Swagger UI](http://185.76.212.27/OPSWebServicesAPI/swagger/ui/index)
- [Swagger JSON](http://185.76.212.27/OPSWebServicesAPI/swagger/docs/v1)

El backend publica Swagger 2.0 con `basePath: /OPSWebServicesAPI`, versión
`v1`, y actualmente expone 46 rutas.

## Estado de la aplicación

- `OPS_ENDPOINTS` contiene las 46 rutas del Swagger.
- Todas las llamadas de producción usan `OpsApiClient`.
- El frontend usa `/ops-api` como proxy y el proxy reenvía a
  `/OPSWebServicesAPI`.
- No quedan endpoints declarados en código que estén ausentes del Swagger.
- `npm run build` pasa correctamente.

## Pendientes funcionales

El payload de `ResendMailAPI` ya fue corregido en
[`auth.service.ts`](../src/app/core/services/auth.service.ts) para enviar
`contractId`, `userName`, `email` y `type`.

La corrección queda cubierta por los tests unitarios de autenticación.

También hay endpoints documentados pero aún no utilizados por ninguna
funcionalidad de la web: operaciones de parking alternativas, `QueryZoneAPI`,
`QueryPlaceAPI`, `UpdateFineStatusAPI` y `AddUserPaymentMethodAPI`. No son
pendientes de migración si esas funcionalidades no están en alcance.

## Prueba contra backend real

Validada el 2026-08-31 con una cuenta activada. Login, perfil, matrículas,
saldo, notificaciones, métodos de pago, formulario de pago, operaciones y
soporte respondieron correctamente con HTTP 200 e `isSuccess: true`.

Las consultas de operaciones y soporte requieren enviar también las fechas
OPS (`hh24missddMMYY`), aunque el Swagger las marque como opcionales.

## Infraestructura limpiada

Se mantiene únicamente la ruta canónica `OPSWebServicesAPI`. Se eliminaron
las reglas de compatibilidad para `OPSWebServicesLegacyAPI` de:

- `proxy.conf.js`
- `proxy.conf.json`
- `deploy/nginx.conf`
- `deploy/nginx.conf.template`

El prefijo `/ops-api` se conserva deliberadamente como proxy interno para no
exponer llamadas directas desde el navegador al host HTTP del backend.
