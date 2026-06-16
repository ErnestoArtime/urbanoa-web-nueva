# Directrices para maqueta web ArinPark

Documento de referencia para cualquier modelo IA que continúe el desarrollo de la maqueta en `web-urbanoa/`.

## 1. Propósito y alcance

- **Maqueta navegable estática** que replica las pantallas de la app Android ArinPark (`com.gertek.urbanoa`).
- **Sin** backend, autenticación real, Google Maps, Paycomet ni lógica de negocio.
- Navegación mediante `routerLink`; datos en `src/app/shared/mock-data.ts`.

## 2. Marca y copy

- Marca visible: **ArinPark** (no usar "Urbanoa" en la UI).
- Idioma: **español** (textos del APK).
- Colores: primario `#548194`, secundario `#808080`, fondo `#f5f7f8`.
- Tipografía: **Nunito** (Google Fonts en `styles.css`).
- Logo: `public/assets/brand/login-logo.jpg`.

## 3. Adaptación web (Justificación de diseño Web)

- **Dashboard** en `/app/home` como entrada (no cargar mapa automáticamente).
- **Móvil (<768px):** bottom-nav (Inicio, Aparcar, Operaciones, Mi cuenta) + flujo secuencial con header y botón Atrás.
- **Desktop (≥768px):** sidebar lateral + split view en listados con detalle.
- Mapa solo en `/app/parking` (placeholder, sin API).
- Card de permisos/perfil en dashboard (sin pop-ups invasivos).

## 4. Stack Angular

- Angular 20, componentes **standalone**.
- Rutas lazy en `app.routes.ts` y `*.routes.ts` por feature.
- Layout principal: `layout/app-shell/` (sidebar + bottom-nav + header).
- Estilos globales y utilidades en `src/styles.css` (clases `.btn`, `.card`, `.list-item`, etc.).

## 5. Estructura de carpetas

```
src/app/
├── layout/          app-shell, sidebar, bottom-nav, app-header, split-view
├── shared/          mock-data.ts
└── features/
    ├── auth/
    ├── onboarding/
    ├── home/
    ├── parking/
    ├── operations/
    └── account/
```

## 6. Mapa de rutas principales

| Área | Ruta base |
|------|-----------|
| Login | `/auth/login` |
| Onboarding | `/onboarding/user` → … → `/onboarding/ready` |
| Dashboard | `/app/home` |
| Aparcar | `/app/parking` → streets → tickets → time-steps → confirm → success |
| Operaciones | `/app/operations` (+ split detail `/detail/:type`) |
| Cuenta | `/app/account` (+ subrutas profile, vehicles, payment-methods, etc.) |

## 7. Split view (desktop)

Usado en:
- `operations/operations-layout`
- `account/vehicles-layout`
- `account/payment-layout`

En móvil: lista OR detalle (clase `split-hidden`). En desktop: ambas columnas visibles.

## 8. Referencias

- APK descomprimido: `../_apk-analysis/` (**no eliminar**).
- Texto diseño web: `../_apk-analysis/_docx-extract/full-text.txt`.
- Plan: `../.cursor/plans/maqueta_web_arinpark_f634c1ba.plan.md`.

## 9. Qué evitar

- No cargar mapa en el dashboard.
- No pop-ups de permisos (usar cards integradas).
- No añadir librerías UI pesadas sin motivo.
- No eliminar `_apk-analysis/`.
- No implementar llamadas HTTP ni validación de formularios.

## 10. Checklist por pantalla nueva

- [ ] Ruta registrada en el `*.routes.ts` correspondiente.
- [ ] Navegación entrante y saliente con `routerLink`.
- [ ] Comportamiento móvil + desktop (header, split view si aplica).
- [ ] Textos en español coherentes con el APK.
- [ ] Reutilizar clases de `styles.css`.

## Ejecutar la maqueta

```bash
cd web-urbanoa
npm install
npm start
```

Abrir `http://localhost:4200` — flujo sugerido: Login → Home → Aparcar / Operaciones / Mi cuenta.
