# Arquitectura y flujos

## Capas

```text
src/app/
├── core/       servicios singleton, estado y reglas compartidas
├── features/   pantallas agrupadas por dominio
├── layout/     app shell, sidebar, bottom navigation y split view
└── shared/     componentes, iconos, pipes, modelos y mock data
```

Los componentes son standalone. La inyección se hace preferentemente con `inject()`. El estado reactivo se mantiene con Signals (`signal`, `computed`, `asReadonly`) y se consume desde las plantillas.

## Rutas principales

| Dominio | Ruta | Flujo |
|---|---|---|
| Auth | `/auth/*` | login, registro y recuperación |
| Onboarding | `/onboarding/*` | usuario → ubicación → pago → notificaciones → listo |
| Dashboard | `/app/home` | aparcamientos activos, operaciones recientes, vehículo, monedero y progreso |
| Aparcar | `/app/parking/*` | mapa/ciudades → calles → tickets → tiempo → confirmación → éxito |
| Operaciones | `/app/operations/*` | listado, detalle, denuncias y reportes |
| Cuenta | `/app/account/*` | perfil, datos fiscales, vehículos, tarjetas, recarga, devolución y ajustes |

`src/app/app.routes.ts` monta el shell y delega cada dominio a sus rutas lazy. Las rutas secundarias deben conservar un encabezado con navegación atrás en móvil.

## Servicios de estado

- `UserService`: usuario de maqueta y datos de perfil.
- `VehicleService`: vehículos, vehículo principal y persistencia local.
- `WalletService`: saldo, tarjetas, tarjeta principal y movimientos.
- `OperationsService`: operaciones e importes del historial.
- `ParkingSessionService`: aparcamientos activos y contador usado por Operaciones.
- `AccountCompletionService`: porcentaje de configuración: perfil, vehículo, tarjeta y ubicación, 25% cada uno.
- `LocationSettingsService`: permiso de ubicación o municipio escogido.
- `TranslationService`: idioma seleccionado y diccionarios.

No mezclar estado de dominio en componentes de presentación. Si llega una API real, separar DTO, modelo de vista, estados de carga/error y adaptadores; no llamar HTTP desde plantillas.

## Reglas de negocio visibles

- Sin vehículo, la tarjeta de vehículo del Dashboard permanece visible con estado vacío y acceso a gestión.
- Sin tarjeta, la tarjeta de monedero permanece visible; recargar está deshabilitado y la ruta de recarga no muestra el formulario.
- El progreso se recalcula desde `AccountCompletionService`; no usar porcentajes fijos.
- El botón de ubicación permanece visible aunque el paso esté completado, porque permite cambiar el municipio.
- Eliminar vehículo o tarjeta requiere confirmación.

## Patrones de componentes

- Inputs: `input()`/`input.required()`; outputs: `output()`.
- Derivaciones: `computed()`; evitar suscripciones manuales si una señal expresa la relación.
- Control de plantilla: `@if`, `@else`, `@for`, `@switch`.
- Navegación: `RouterLink` para enlaces declarativos; `Router` solo cuando hay validación o parámetros dinámicos.
- Preferir componentes de `shared` antes de duplicar HTML o estilos.
