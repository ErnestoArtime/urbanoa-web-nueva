# Flujo de traducciones JSON ↔ Excel

Los catálogos de la aplicación están en `public/assets/i18n/*.json`. `es.json` es el catálogo maestro y el Excel es el formato que se entrega al cliente para revisar etiquetas y traducciones.

## Comandos habituales

```powershell
# Comprueba claves, idiomas, marcadores pendientes y textos directos.
npm run i18n:audit

# Iguala eu/fr/uk con es. Las traducciones nuevas se identifican con
# el idioma y el texto español para que sean visibles en el Excel.
npm run i18n:sync

# Genera el Excel que se envía al cliente.
npm run i18n:excel

# Importa el Excel devuelto por el cliente.
npm run i18n:import -- --input "docs/traducciones-revisadas.xlsx"

# Verifica el recorrido JSON → Excel → JSON sin modificar los catálogos reales.
npm run i18n:test
```

`npm run i18n:sync` también elimina de `eu.json`, `fr.json` y `uk.json` las claves que no existen en español. Los valores provisionales continúan apareciendo como pendientes en la auditoría hasta que el cliente los traduzca.

## Generar y entregar el Excel

```powershell
npm run i18n:sync
npm run i18n:excel
```

El resultado es `docs/traducciones_agrupadas_urbanoa.xlsx`. Conserva las pestañas conocidas, mantiene `Índice` como última hoja y actualiza las cantidades. Las claves nuevas se asignan mediante `sheetRules` de `i18n-excel.config.json`; si ninguna regla coincide, se utiliza `General`.

La correspondencia actual es:

- `app.*`, `nav.*`, `layout.*`, `common.*`, `validation.*` y `breadcrumb.*` → `Inicio y comunes`.
- `auth.*` → `Autenticación`.
- `onboarding.*` → `Onboarding`.
- `dashboard.*` → `Dashboard`.
- `parking.*` → `Aparcar`.
- `ops.*` → `Operaciones`.
- `account.*` → `Cuenta`.
- `payment.*` y `wallet.*` → `Pagos y cartera`.

Hay que cerrar el archivo en Excel antes de regenerarlo para evitar el error `EBUSY`.

## Importar la devolución del cliente

Guarda la devolución con otro nombre y ejecuta:

```powershell
npm run i18n:import -- --input "docs/traducciones-revisadas.xlsx"
```

La importación valida todo antes de modificar los JSON. No escribe si faltan columnas de idioma, hay claves duplicadas o inválidas, traducciones vacías o claves distintas del catálogo maestro. Solo de forma excepcional se pueden permitir vacíos con `--allow-empty`.

No se debe modificar la columna `Clave`, los encabezados de idiomas ni las interpolaciones como `{{name}}`.

## Auditoría y limpieza

```powershell
npm run i18n:audit
```

Genera:

- `docs/i18n-audit.json`
- `docs/i18n-direct-literals.md`

Comprueba que las claves españolas estén utilizadas en el código, que existan en los cuatro idiomas y que no haya textos visibles escritos directamente en HTML o TypeScript. Los comentarios se excluyen del análisis.

La limpieza de claves sin uso es destructiva:

```powershell
npm run i18n:test
npm run i18n:audit
npm run i18n:prune
```

Debe ejecutarse únicamente después de revisar los usos dinámicos configurados. Todos los cambios quedan recuperables mediante Git.

## Verificación antes del commit

```powershell
npm run i18n:test
npm run i18n:audit
npm run lint
npm run build
```

Flujo recomendado para otro integrante:

```powershell
git pull
npm ci

npm run i18n:sync
npm run i18n:excel

# El cliente revisa y devuelve el Excel.

npm run i18n:import -- --input "docs/traducciones-revisadas.xlsx"
npm run i18n:test
npm run i18n:audit
npm run build
```

## Prompt reutilizable

> Adapta el flujo JSON ↔ Excel de este repositorio al proyecto actual. Detecta la biblioteca i18n, la estructura plana o anidada de los catálogos, el idioma maestro y los idiomas obligatorios. Configura auditoría, sincronización, exportación e importación. Antes de eliminar claves, analiza pipes, servicios, mapas, plantillas, concatenaciones, claves dinámicas y consultas de objetos padre. Excluye comentarios del detector de textos directos. Conserva la estructura del Excel conocida por el cliente y deja `Índice` como última hoja. Añade pruebas de JSON → Excel → JSON y verifica la compilación.
