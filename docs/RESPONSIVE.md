# Responsive y accesibilidad

## Breakpoints y shell

- `< 960px`: navegación inferior, una columna y rutas secundarias con encabezado/atrás.
- `≥ 960px`: sidebar lateral y split view con lista y detalle visibles.
- `--breakpoint-split` es `960px`; no introducir otro breakpoint para el mismo patrón sin justificarlo.
- `--sidebar-width`, `--header-height` y `--bottom-nav-height` son medidas estructurales.

El dashboard no carga el mapa. El mapa solo pertenece al flujo de Aparcar.

## Reglas de implementación

1. Diseñar primero el ancho móvil aproximado de 390px y después ampliar.
2. Usar flex/grid fluidos, `minmax`, `max-width`, `gap` y `flex-wrap`; evitar overflow horizontal.
3. En tarjetas con varias acciones, permitir salto de línea y conservar separación constante.
4. En split view, móvil muestra lista o detalle según la ruta; escritorio muestra ambos.
5. Los iconos no deben empujar el texto: definir tamaño y `flex-shrink: 0`.
6. Mantener objetivos táctiles cómodos (aprox. 44px).
7. Probar textos largos en los cuatro idiomas.

## Estados que hay que probar

- Lista con datos y lista vacía.
- Sin tarjeta, sin vehículo y sin ubicación.
- Uno y varios aparcamientos activos.
- Botones deshabilitados y formularios con errores.
- Modal de confirmación en móvil y escritorio.
- Navegación directa a rutas secundarias sin estado previo.

## Accesibilidad funcional

- Mantener orden de foco lógico y permitir `Escape` en menús/modales.
- Usar `aria-label`, `aria-expanded`, `aria-disabled` o `disabled` según el control.
- Los formularios marcan obligatorios, validan formato y muestran error junto al campo.
- Las imágenes decorativas llevan `aria-hidden`; las informativas llevan `alt` traducible.

## Verificación visual

Comprobar al menos `390×844` y `1440×900`. Revisar consola, overflow, foco, contraste y botones que se solapen.
