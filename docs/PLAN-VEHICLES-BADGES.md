# Plan: Arreglo de badges y subtítulos en la lista de vehículos

**Fecha:** 2026-08-25
**Estado:** aprobado, pendiente de implementación

## Problema detectado

1. En la lista de vehículos (Cuenta › Vehículos), las filas no-principales
   muestran `[]` o `[Coche principal]` en lugar del subtítulo.

   Causa: el subtítulo pasa el campo `label` por `TranslatePipe`, que
   devuelve `` `[clave]` `` cuando la clave no existe en el catálogo
   (`translation.service.ts:28`). El bug está en:

   - `vehicles-layout.component.ts:32`
   - `menu.component.ts:149` (misma lógica copiada)

   Orígenes de `label` afectados:

   | Origen | `label` | Render actual |
   |---|---|---|
   | Remoto (`QueryUserPlatesAPI`) | no existe | `[]` |
   | Mock / localStorage antiguo | `'Coche principal'` (texto plano) | `[Coche principal]` |
   | Añadido con "matrícula extranjera" | `'account.vehicle.foreignPlate'` | correcto |
   | Añadido normal | `undefined` | `[]` |

2. Problemas relacionados encontrados en la misma revisión:

   - `map.component.ts:78`: muestra `v.label` **sin traducir** → con
     matrícula extranjera enseñaría la clave cruda.
   - `map.component.ts:82`: badge con estrella unicode `★`.
   - `vehicle-card.component.ts:84`: mezcla clave/texto igual que el punto 1.
   - `.badge-warning` **no existe** en `styles.css` → los badges "Ya se
     encuentra aparcado" (lista y mapa) salen sin estilo de color.

## Cambios previstos

### 1. `translation.service.ts`

Nuevo método público:

```ts
translateLabel(value?: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  return this.translations()[trimmed] ?? trimmed;
}
```

Semántica decidida con el usuario: **sin texto por defecto**. Si `label`
no existe ni como clave del catálogo ni como texto, el subtítulo queda
vacío.

### 2. `vehicles-layout.component.ts` + `menu.component.ts`

Sustituir la interpolación del subtítulo por un método del componente que
use `translateLabel`:

- favorito → `account.vehicleFavorite` traducido
- resto → `translateLabel(v.label)`

### 3. `map.component.ts`

- Línea 78: usar `translateLabel(v.label)` (elimina claves crudas).
- Línea 82: sustituir el badge con estrella unicode `★` por el icono
  Lucide `lucideStar` (consistente con vehicles-layout).

### 4. `vehicle-card.component.ts`

Línea 84: aplicar `translateLabel` al fallback de `label`.

### 5. `styles.css`

Añadir `.badge-warning` (ámbar suave, coherente con `.data-notice`).

## Verificación final

Ejecutar al terminar la implementación:

```
npx tsc --noEmit
npx ng test --watch=false --browsers=ChromeHeadless   (54/54 esperado)
npm run lint
npm run format && npm run format:check
npm run build
```

## Pendientes fuera de alcance

- Confirmación de equipo sobre el prefijo API3 (`SWAGGER-REVIEW-FINDINGS.md`
  punto 13).
- Limpieza de artefactos i18n generados + `.gitignore` del Excel de
  traducciones.
