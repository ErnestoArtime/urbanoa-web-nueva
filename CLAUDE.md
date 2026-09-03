# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Conventions

`AGENTS.md` at the repo root is the authoritative style guide (import ordering, signals/`inject()` patterns, file naming, CSS conventions, non-negotiable rules such as no `*ngIf`/`*ngFor`, no constructor DI, no code comments). Read it before writing code; it is not duplicated here.

## Commands

| Command | Notes |
|---------|-------|
| `npm start` | Dev server on `localhost:4200`, `development` configuration, proxy enabled |
| `npm run build` | Production build → `dist/web-urbanoa/browser` |
| `npm test` | Karma + Jasmine in Chrome (watch mode) |
| `npm run lint` | ESLint over `src/**/*.ts` and `src/**/*.html` (Prettier violations are lint errors) |
| `npm run format` / `format:check` | Prettier |
| `npm run i18n:check` | `scripts/check-i18n.mjs` — locale parity + key usage |

Single test run / single spec file:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm test -- --include=src/app/core/services/wallet.service.spec.ts
```

Two package scripts are broken as written — do not rely on them:
- `npm run check` calls `build:prod`, which does not exist (the build script is `build`). Run `npm run i18n:check && npm run lint && npm run format:check && npm run build` instead.
- `npm run start-local` passes `--configuration=local`, which is not defined in `angular.json` (only `production` and `development` exist).

## Architecture

Angular 20 standalone SPA, **zoneless** (`provideZonelessChangeDetection`), signals-only state, router configured `withComponentInputBinding()`. No `NgModule`, no NgRx, no `HttpClient` — network calls use raw `fetch`.

### Data layer: backend-first

Backend state lives in `@Injectable({providedIn:'root'})` signal services under `src/app/core/services/`. OPS calls go through `OpsApiClient`, which validates the standard response envelope and propagates transport/backend errors. Services may persist confirmed data such as language, preferences, cards or vehicles in `localStorage`, but never seed API state or replace failed requests with mock responses.

The OPS API is exposed through `opsApiBaseUrl` → `/ops-api` and proxied in development by `proxy.conf.json`/`proxy.conf.js`. All endpoints target the unified `OPSWebServicesAPI`; the proxy still accepts the former `OPSWebServicesLegacyAPI` prefix for cached clients. Legal/FAQ content uses `externalContentBaseUrl` → `/external-content`.

When backend data is unavailable, screens show an empty/error state and allow retry. A legacy `mock-` token is discarded during session startup; it is not accepted as a credential and never triggers a local API response.

### Routing

`app.routes.ts` has three independent trees, all lazy: `auth/**`, `onboarding/**`, and `app/**` (wrapped in `AppShellComponent`). Every feature exposes a `*_ROUTES` const from `features/<name>/<name>.routes.ts`.

### Shell and responsive layout

`layout/app-shell/app-shell.component.ts` is the single responsive switch: below 960px it renders `app-header` + `app-bottom-nav`; at ≥960px it renders `app-sidebar` + a toolbar with breadcrumb and language selector. It also drives a minimum-1s route transition loader off router events.

Two URL-keyed lookup tables must be updated when adding a route under `/app`, or the new page shows a wrong title/breadcrumb:
- `TITLE_KEYS` in `app-shell.component.ts` (mobile header title, matched by `url.startsWith(path)`).
- `labelForSegment()` in `core/services/breadcrumb.service.ts` (breadcrumbs are derived from URL segments, not route data).

### Master/detail pattern

`layout/split-view/split-view.component.ts` provides a list pane (`<ng-content select="[splitList]">`) and a detail pane (`<router-outlet>`). Feature "layout"/"shell" components (`account-shell`, `vehicles-layout`, `payment-layout`, `operations-layout`) render the list and toggle `[hideList]`/`[hideDetail]` based on whether a child route is active — so on mobile only one pane shows, on desktop both. Child routes of those layouts render into the detail outlet.

### Parking wizard

The multi-step parking flow (`features/parking/`) is the most stateful area:
- `ParkingFlowStore` is a root-provided signal store holding a `Partial<ParkingFlowState>`. It is **not** persisted — reloads rely on query params instead.
- `parking-flow.guard.ts` exports one `CanActivateFn` per step (`canAccessParkingTicketStep`, `…TimeStep`, `…ConfirmStep`, `…SuccessStep`). Each guard first hydrates the store from the route's query params, then checks predicates on the store (`hasLocationData()`, `hasTicketData()`, `canConfirm()`); failure redirects to `/app/parking?flowError=missingData`.
- Because state round-trips through the URL, adding a field to `ParkingFlowState` requires updating **three** mapping sites: `ParkingFlowStore.fromQueryParams`, `ParkingFlowStore.toQueryParams`, and `loadRouteQuery` in the guard.

### i18n

`TranslationService` fetches `public/assets/i18n/{lang}.json` at runtime into a signal (`es` default, plus `eu`, `fr`, `uk`; falls back to `es`, persists choice under `urbanoa-lang`). `TranslatePipe` is **impure** so it re-renders on language change. A missing key renders as `[the.key]` rather than throwing.

`npm run i18n:check` enforces that every non-`es` locale has exactly the same key set as `es.json`, and that every key used in `src/` exists in `es.json`. It finds keys by regex over `'key' | translate` and `translate('key')` with **literal strings only** — keys built dynamically are reported as missing/unused, so keep translation keys literal at the call site.

### Icons

Two systems coexist: `shared/icons/app-icon.component.ts` renders inline SVG paths from `shared/icons/icon-paths.ts`, and `@lucide/angular` is used directly elsewhere. Prefer matching whatever the surrounding file uses.

## Deployment

`deploy/` holds a Dockerfile + nginx config; `Jenkinsfile` builds the image and deploys over SSH. Production bundle budgets are enforced (`initial` 1MB error, `anyComponentStyle` 8kB error) — a large inline component `styles:` block can fail the production build.
