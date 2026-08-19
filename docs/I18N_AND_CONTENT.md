# Contenido e internacionalización

## Diccionarios

```text
public/assets/i18n/es.json
public/assets/i18n/eu.json
public/assets/i18n/fr.json
public/assets/i18n/uk.json
```

El español es la fuente de claves. Cada clave nueva debe existir en los cuatro ficheros antes de entregar el cambio.

## Uso en componentes

- Importar `TranslatePipe` y usar `{{ 'namespace.key' | translate }}`.
- Para parámetros: `| translate: { name: value }`.
- No escribir textos visibles directamente en HTML o TypeScript.
- No construir claves dinámicas no garantizadas en los catálogos.
- Las etiquetas ARIA, títulos, mensajes de error y estados vacíos también se traducen.

## Convenciones de claves

Usar nombres por dominio y pantalla: `dashboard.profileCompletion.title`, `account.vehicleEdit.confirmDeleteMessage`, `parking.confirm.balanceAfter` y `ops.detail.totalTime`.

Preferir claves semánticas (`emptyTitle`, `delete`, `confirm`) frente a claves ligadas a una posición visual.

## Formatos

- Moneda: `DecimalPipe` con `1.2-2` o un formateador localizado; nunca interpolar el número crudo.
- Fechas y horas: usar el formato de la pantalla y el idioma activo.
- Placas y nombres propios no se traducen.
- No concatenar frases con espacios en TypeScript si puede resolverse con una clave parametrizada.

## Comprobación

```bash
npm run i18n:check
```

El comando valida paridad de claves. La lista de claves potencialmente no usadas es informativa; no eliminar una clave sin comprobar que no pertenezca a un flujo lazy o a contenido dinámico.
