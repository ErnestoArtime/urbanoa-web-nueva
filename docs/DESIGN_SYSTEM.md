# Sistema visual y de interacción

## Fuente de verdad

Los tokens globales están en `src/styles.css`. Reutilizarlos en lugar de introducir colores o medidas arbitrarias.

| Grupo | Tokens principales |
|---|---|
| Marca | `--color-primary`, `--color-primary-dark`, `--color-primary-light` |
| Fondo/superficie | `--color-background`, `--color-surface`, `--card-bg` |
| Texto | `--color-text`, `--color-text-muted` |
| Estados | `--color-error`, `--color-success`, `--color-warning`, `--color-active` |
| Bordes | `--color-border`, `--radius-sm/md/lg/pill` |
| Espaciado | `--space-1` a `--space-6` |
| Tipografía | `--font-family`, `--text-xs` a `--text-display`, pesos `--font-*` |
| Profundidad | `--shadow-sm`, `--shadow-md`, `--shadow-card` |

La apariencia debe ser marfil, teal y verde apagado, con tarjetas redondeadas, sombras suaves y acciones primarias en forma de píldora.

## Componentes base

- `.card`: superficie agrupadora; usar para secciones y estados vacíos.
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`: acciones.
- `.list`, `.list-item`, `.badge`: listados y estados compactos.
- `.form-input`, `.form-error`, `.switch`: formularios y validación.
- `app-icon`: iconos consistentes; preferir el catálogo antes que SVGs sueltos.
- `app-result-modal`: confirmaciones y resultados; usar `type="delete"` para eliminaciones.
- `app-split-view`: patrón listado-detalle para cuenta y operaciones.

## Composición

- Una tarjeta debe tener jerarquía clara: título, detalle, estado y acción.
- Agrupar botones con `display:flex`, `gap` y `flex-wrap`; nunca depender de espacios manuales.
- Los estados vacíos mantienen la tarjeta, centran el mensaje y separan la acción con margen vertical.
- Las cantidades monetarias se presentan con dos decimales y formato localizado.
- Los negativos usan error; devoluciones y saldos positivos usan éxito.
- No usar emojis como iconos de producto. Utilizar `app-icon`, Lucide o SVG geométrico coherente.

## Accesibilidad visual

- Todo botón debe tener texto o `aria-label` traducido.
- Los estados `disabled` comunican el estado por contraste, opacidad y cursor, no solo por color.
- Mantener foco visible.
- No transmitir información solo mediante color: acompañar con texto, icono o estado.
