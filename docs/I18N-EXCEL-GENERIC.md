# Solución genérica de traducciones JSON ↔ Excel

La herramienta `scripts/i18n-excel.mjs` se puede reutilizar en proyectos con catálogos JSON planos o anidados. Su comportamiento se define en `i18n-excel.config.json`.

## Archivos y dependencia

- `scripts/i18n-excel.mjs`
- `scripts/i18n-excel.roundtrip.test.mjs`
- `docs/i18n-excel.config.example.json`

```powershell
npm install --save-dev exceljs
```

## Configuración principal

- `cataloguesDir`: carpeta de los JSON.
- `sourceDir`: código que consume traducciones.
- `referenceLanguage`: idioma maestro.
- `requiredLanguages`: idiomas obligatorios.
- `catalogueStructure`: `flat` para claves punteadas en el primer nivel o `nested` para objetos.
- `template`: plantilla conocida por el cliente, o `null` para crear un libro básico.
- `dynamicPrefixes`: familias construidas en ejecución.
- `ignoredKeyPrefixes`: claves técnicas que no pertenecen al catálogo.
- `translationKeyPrefixes`: limita la detección indirecta a familias de traducción reales.
- `ignoredDirectLiterals`: valores técnicos o legales conocidos que no deben tratarse como textos traducibles.
- `missingTranslationPattern`: marcador provisional creado por `sync`.

La herramienta reconoce pipes, llamadas a servicios de traducción, valores de mapas, claves en plantillas y concatenaciones. En catálogos anidados, consultar una clave padre protege todos sus descendientes. Los comentarios HTML y TypeScript se ignoran.

## Comandos genéricos

```powershell
node scripts/i18n-excel.mjs audit --config i18n-excel.config.json
node scripts/i18n-excel.mjs sync --config i18n-excel.config.json
node scripts/i18n-excel.mjs prune --config i18n-excel.config.json
node scripts/i18n-excel.mjs export --config i18n-excel.config.json
node scripts/i18n-excel.mjs import --config i18n-excel.config.json --input docs/traducciones-revisadas.xlsx
```

`audit` y `export` no modifican los catálogos. `import` valida todas las filas antes de escribir. `sync` iguala los idiomas con el catálogo maestro. `prune` elimina claves sin uso y debe ejecutarse solo después de revisar los usos dinámicos y ejecutar las pruebas.

Para React, Vue, i18next u otra API, se mantienen la configuración y el flujo Excel; se adaptan las expresiones de `extractTranslationKeys` y las extensiones de código admitidas.
