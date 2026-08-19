# Flujo de traducciones JSON ↔ Excel

Los catálogos están en `public/assets/i18n/*.json`. `es.json` es el catálogo maestro y el Excel es el formato que se entrega al cliente para revisar etiquetas y traducciones.

## 1. Comprobar las traducciones

```powershell
npm run i18n:audit
```

Comprueba:

- Claves utilizadas que no existen en español.
- Claves españolas sin uso.
- Diferencias entre `es`, `eu`, `fr` y `uk`.
- Traducciones vacías o pendientes.
- Textos directos candidatos en HTML y TypeScript.
- Correspondencia entre el código, los catálogos y el Excel.

Genera:

```text
docs/i18n-audit.json
docs/i18n-direct-literals.md
```

Este comando no modifica los JSON ni el Excel.

## 2. Añadir una clave nueva

Primero se añade la clave en `es.json` y se utiliza desde el código. Después:

```powershell
npm run i18n:sync
npm run i18n:excel
```

`i18n:sync`:

- Considera `es.json` como catálogo maestro.
- Añade la clave en `eu.json`, `fr.json` y `uk.json`.
- Utiliza marcadores como `eu_Próximo pago`, `fr_Próximo pago` y `uk_Próximo pago`.
- No sobrescribe traducciones existentes.
- Elimina de los demás idiomas las claves que no existen en español.

`i18n:excel` genera:

```text
docs/traducciones_agrupadas_urbanoa.xlsx
```

Hay que cerrar el Excel antes de regenerarlo para evitar el error `EBUSY`.

## 3. Generar el Excel desde los JSON

```powershell
npm run i18n:excel
```

El comando:

- Lee los cuatro JSON.
- Incluye las claves utilizadas en el proyecto.
- Mantiene las pestañas conocidas por el cliente.
- Conserva `Índice` como última hoja.
- Asigna las claves a las hojas mediante `sheetRules` de `i18n-excel.config.json`.
- Coloca en `General` las claves nuevas que no coincidan con ninguna regla.
- Actualiza las cantidades del índice.
- Resalta las traducciones pendientes.
- No modifica los JSON.

La correspondencia actual es:

- `app.*`, `nav.*`, `layout.*`, `common.*`, `validation.*` y `breadcrumb.*` → `Inicio y comunes`.
- `auth.*` → `Autenticación`.
- `onboarding.*` → `Onboarding`.
- `dashboard.*` → `Dashboard`.
- `parking.*` → `Aparcar`.
- `ops.*` → `Operaciones`.
- `account.*` → `Cuenta`.
- `payment.*` y `wallet.*` → `Pagos y cartera`.

Para incluir también claves sin uso:

```powershell
node scripts/i18n-excel.mjs export --config i18n-excel.config.json --out docs/traducciones-completas.xlsx --include-unused
```

## 4. Importar el Excel traducido

Se recomienda guardar la devolución con otro nombre:

```text
docs/traducciones-revisadas.xlsx
```

Después:

```powershell
npm run i18n:import -- --input "docs/traducciones-revisadas.xlsx"
```

La importación:

- Lee la hoja `Resumen`.
- Exige las columnas `es`, `eu`, `fr` y `uk`.
- Detecta claves duplicadas o inválidas.
- Rechaza traducciones vacías.
- Comprueba que las claves correspondan con el catálogo maestro.
- Valida todo antes de modificar los JSON.
- Escribe cada traducción en la clave correspondiente.
- Permite marcadores pendientes, aunque la auditoría los seguirá señalando como traducciones por completar.

No se debe modificar la columna `Clave`, los encabezados de idiomas ni interpolaciones como `{{name}}`.

Para permitir deliberadamente valores vacíos:

```powershell
npm run i18n:import -- --input "docs/traducciones-revisadas.xlsx" --allow-empty
```

Después de importar:

```powershell
npm run i18n:audit
```

## 5. Eliminar claves sin uso

```powershell
npm run i18n:prune
```

Este comando elimina de los cuatro idiomas las claves españolas consideradas sin uso.

Antes de ejecutarlo:

```powershell
npm run i18n:audit
npm run i18n:test
```

El detector tiene en cuenta:

- Claves utilizadas mediante pipes y el servicio de traducción.
- Claves indirectas almacenadas en mapas o propiedades.
- Prefijos construidos mediante plantillas o concatenaciones.
- Familias declaradas en `dynamicPrefixes`.
- Comentarios HTML y TypeScript, que se excluyen del análisis.

Actualmente `dynamicPrefixes` está vacío. Si en el futuro una familia se construye completamente en ejecución o llega desde un servicio externo, debe añadirse a esa configuración antes de ejecutar `prune`.

Después de la limpieza:

```powershell
npm run i18n:sync
npm run i18n:audit
npm run i18n:excel
```

## 6. Verificación final

```powershell
npm run i18n:test
npm run i18n:audit
npm run build
```

`i18n:test` comprueba el recorrido JSON → Excel → JSON con archivos temporales y no modifica los catálogos reales.
