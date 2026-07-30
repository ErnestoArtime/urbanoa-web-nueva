import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import ExcelJS from 'exceljs';

const repo = process.cwd();
const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'urbanoa-i18n-roundtrip-'));
const languageDirectory = path.join(temporaryRoot, 'langs');
const fullLanguageDirectory = path.join(temporaryRoot, 'full-langs');
const sourceDirectory = path.join(temporaryRoot, 'src');
const flatConfig = path.join(temporaryRoot, 'flat-config.json');
const exportedWorkbook = path.join(temporaryRoot, 'json-to-excel.xlsx');
const reviewedWorkbook = path.join(temporaryRoot, 'excel-to-json.xlsx');
const completedWorkbook = path.join(temporaryRoot, 'completed-full-excel.xlsx');
const genericRoot = path.join(temporaryRoot, 'generic-project');
const testKey = 'auth.i18nRoundtripTest.newEntry';
const serviceKey = 'i18n_roundtrip_test.service_entry';
const languages = ['es', 'eu', 'fr', 'uk'];

const setByPath = (target, dottedKey, value) => {
  const parts = dottedKey.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) current = current[part] ??= {};
  current[parts.at(-1)] = value;
};

const flatten = (value, prefix = '', output = new Map()) => {
  for (const [part, child] of Object.entries(value)) {
    const childKey = prefix ? `${prefix}.${part}` : part;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      flatten(child, childKey, output);
    } else {
      output.set(childKey, Array.isArray(child) ? JSON.stringify(child) : child);
    }
  }
  return output;
};

const run = (...args) =>
  execFileSync(process.execPath, [path.join(repo, 'scripts/i18n-excel.mjs'), ...args], { cwd: repo, encoding: 'utf8' });

try {
  await fs.mkdir(languageDirectory, { recursive: true });
  await fs.mkdir(sourceDirectory, { recursive: true });
  const beforeImport = new Map();

  for (const language of languages) {
    const input = JSON.parse(await fs.readFile(path.join(repo, 'public/assets/i18n', `${language}.json`), 'utf8'));
    if (language === 'es') input[testKey] = 'MASTER_ES';
    input[serviceKey] = `SERVICE_${language.toUpperCase()}`;
    if (language === 'eu') input['i18n_roundtrip_orphan.only'] = 'ORPHAN';
    await fs.writeFile(path.join(languageDirectory, `${language}.json`), `${JSON.stringify(input, null, 2)}\n`, 'utf8');
  }
  await fs.writeFile(
    flatConfig,
    `${JSON.stringify(
      {
        cataloguesDir: languageDirectory,
        sourceDir: sourceDirectory,
        referenceLanguage: 'es',
        requiredLanguages: languages,
        catalogueStructure: 'flat',
        template: path.join(repo, 'docs/traducciones_agrupadas_urbanoa - original.xlsx'),
        output: exportedWorkbook,
        auditOutput: path.join(temporaryRoot, 'audit.json'),
        literalsOutput: path.join(temporaryRoot, 'literals.md'),
        summarySheet: 'Resumen',
        indexSheet: 'Índice',
        generalSheet: 'General',
        missingTranslationPattern: '{language}_{reference}',
        supportedExtensions: ['.html', '.ts'],
        excludedFileSuffixes: ['.spec.ts'],
        dynamicPrefixes: [],
        sheetRules: [{ sheet: 'Autenticación', prefixes: ['auth.'] }],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  run('sync', '--config', flatConfig);
  for (const language of languages) {
    const synced = JSON.parse(await fs.readFile(path.join(languageDirectory, `${language}.json`), 'utf8'));
    const syncedFlat = new Map(Object.entries(synced));
    if (!syncedFlat.has(testKey)) {
      throw new Error(`${language}: sync no creó la clave del catálogo maestro.`);
    }
    if (language !== 'es' && syncedFlat.get(testKey) !== `${language}_MASTER_ES`) {
      throw new Error(`${language}: sync debe identificar la traducción pendiente con idioma y texto maestro.`);
    }
    if (syncedFlat.has('i18n_roundtrip_orphan.only')) {
      throw new Error(`${language}: sync no eliminó una clave huérfana.`);
    }
    synced[testKey] = `EXPORT_${language.toUpperCase()}`;
    beforeImport.set(language, structuredClone(synced));
    await fs.writeFile(path.join(languageDirectory, `${language}.json`), `${JSON.stringify(synced, null, 2)}\n`, 'utf8');
  }
  await fs.writeFile(path.join(sourceDirectory, 'fixture.html'), `<span>{{ '${testKey}' | translate }}</span>\n`, 'utf8');
  await fs.writeFile(path.join(sourceDirectory, 'service-call.ts'), `translationService.translate('${serviceKey}');\n`, 'utf8');

  run('prune', '--config', flatConfig);
  for (const language of languages) {
    const prunedCatalogue = JSON.parse(await fs.readFile(path.join(languageDirectory, `${language}.json`), 'utf8'));
    if (typeof prunedCatalogue[serviceKey] !== 'string') {
      throw new Error(`${language}: prune eliminó ${serviceKey} usado por TranslationService.translate.`);
    }
    if (prunedCatalogue.i18n_roundtrip_test) {
      throw new Error(`${language}: el flujo plano creó una estructura anidada inesperada.`);
    }
    beforeImport.set(language, structuredClone(prunedCatalogue));
  }

  run('export', '--config', flatConfig);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(exportedWorkbook);
  const summary = workbook.getWorksheet('Resumen');
  const authenticationSheet = workbook.getWorksheet('Autenticación');
  const keyIsInAuthentication = authenticationSheet.getColumn(1).values.some((value) => String(value ?? '').trim() === testKey);
  if (!keyIsInAuthentication) {
    throw new Error(`La regla auth.* no asignó ${testKey} a Autenticación.`);
  }
  const headers = new Map();
  summary.getRow(1).eachCell((cell, column) => {
    headers.set(
      String(cell.value ?? '')
        .trim()
        .toLowerCase(),
      column,
    );
  });
  let targetRow = 0;
  summary.eachRow((row, number) => {
    if (String(row.getCell(1).value ?? '').trim() === testKey) targetRow = number;
  });
  if (!targetRow) throw new Error(`JSON → Excel: no apareció ${testKey} en Resumen.`);

  for (const language of languages) {
    const column = headers.get(language);
    if (!column) throw new Error(`Excel: falta la columna ${language}.`);
    summary.getRow(targetRow).getCell(column).value = `IMPORTED_${language.toUpperCase()}`;
  }
  await workbook.xlsx.writeFile(reviewedWorkbook);

  run('import', '--config', flatConfig, '--input', reviewedWorkbook);

  for (const language of languages) {
    const after = JSON.parse(await fs.readFile(path.join(languageDirectory, `${language}.json`), 'utf8'));
    const beforeFlat = flatten(beforeImport.get(language));
    const afterFlat = flatten(after);
    const changed = [...new Set([...beforeFlat.keys(), ...afterFlat.keys()])].filter((key) => beforeFlat.get(key) !== afterFlat.get(key));
    if (changed.length !== 1 || changed[0] !== testKey) {
      throw new Error(`${language}: cambios inesperados: ${changed.join(', ')}`);
    }
    if (afterFlat.get(testKey) !== `IMPORTED_${language.toUpperCase()}`) {
      throw new Error(`${language}: la traducción no volvió a la clave correcta.`);
    }
  }

  const genericLanguages = ['en', 'es', 'de'];
  const genericLanguageDirectory = path.join(genericRoot, 'locales');
  const genericSourceDirectory = path.join(genericRoot, 'app');
  const genericConfig = path.join(genericRoot, 'i18n-excel.config.json');
  const genericOutput = path.join(genericRoot, 'translations.xlsx');
  await fs.mkdir(genericLanguageDirectory, { recursive: true });
  await fs.mkdir(genericSourceDirectory, { recursive: true });
  for (const language of genericLanguages) {
    await fs.writeFile(
      path.join(genericLanguageDirectory, `${language}.json`),
      `${JSON.stringify(
        {
          static: {
            title: `TITLE_${language}`,
            ...(language === 'en' ? { pending: 'Pending payment' } : {}),
          },
          backend_status: { OPEN: `OPEN_${language}`, CLOSED: `CLOSED_${language}` },
          widget: { accept: `ACCEPT_${language}`, cancel: `CANCEL_${language}` },
          unused: { obsolete: `UNUSED_${language}` },
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }
  await fs.writeFile(
    path.join(genericSourceDirectory, 'fixture.ts'),
    [
      `translateService.instant('static.title');`,
      `translateService.instant('static.pending');`,
      `translateService.instant('widget');`,
      `translateService.instant(statusKey);`,
    ].join('\n'),
    'utf8',
  );
  await fs.writeFile(
    genericConfig,
    `${JSON.stringify(
      {
        cataloguesDir: genericLanguageDirectory,
        sourceDir: genericSourceDirectory,
        referenceLanguage: 'en',
        requiredLanguages: genericLanguages,
        catalogueStructure: 'nested',
        template: null,
        output: genericOutput,
        auditOutput: path.join(genericRoot, 'audit.json'),
        literalsOutput: path.join(genericRoot, 'literals.md'),
        summarySheet: 'Resumen',
        indexSheet: 'Índice',
        generalSheet: 'General',
        keyColumnWidth: 38,
        languageColumnWidth: 24,
        featureColumnWidth: 24,
        supportedExtensions: ['.ts'],
        excludedFileSuffixes: ['.spec.ts'],
        dynamicPrefixes: ['backend_status.'],
        sheetRules: [
          { sheet: 'Textos', prefixes: ['static.'] },
          { sheet: 'Estados', prefixes: ['backend_status.'] },
          { sheet: 'Componentes', prefixes: ['widget.'] },
        ],
        missingTranslationPattern: '{language}_{reference}',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
  run('prune', '--config', genericConfig);
  run('export', '--config', genericConfig);
  const genericCatalogue = flatten(JSON.parse(await fs.readFile(path.join(genericLanguageDirectory, 'en.json'), 'utf8')));
  for (const key of ['static.title', 'static.pending', 'backend_status.OPEN', 'backend_status.CLOSED', 'widget.accept', 'widget.cancel']) {
    if (!genericCatalogue.has(key)) throw new Error(`Genérico: prune eliminó ${key}.`);
  }
  for (const language of ['es', 'de']) {
    const catalogue = flatten(JSON.parse(await fs.readFile(path.join(genericLanguageDirectory, `${language}.json`), 'utf8')));
    if (catalogue.get('static.pending') !== `${language}_Pending payment`) {
      throw new Error(`Genérico: sync no respetó el idioma maestro configurado para ${language}.`);
    }
  }
  run('audit', '--config', genericConfig);
  const genericAudit = JSON.parse(await fs.readFile(path.join(genericRoot, 'audit.json'), 'utf8'));
  for (const language of ['es', 'de']) {
    if (!genericAudit.placeholderUsedInCatalogues[language].includes('static.pending')) {
      throw new Error(`Genérico: audit no identificó el marcador pendiente para ${language}.`);
    }
  }
  if (genericCatalogue.has('unused.obsolete')) {
    throw new Error('Genérico: prune no eliminó unused.obsolete.');
  }
  const genericWorkbook = new ExcelJS.Workbook();
  await genericWorkbook.xlsx.readFile(genericOutput);
  const genericSummary = genericWorkbook.getWorksheet('Resumen');
  const genericGeneral = genericWorkbook.getWorksheet('General');
  const genericSheetOrder = genericWorkbook.worksheets.map((sheet) => sheet.name);
  if (genericSheetOrder.join(',') !== 'Resumen,Textos,Estados,Componentes,General,Índice') {
    throw new Error(`Genérico: las reglas no crearon las hojas esperadas: ${genericSheetOrder.join(',')}.`);
  }
  const staticKeys = genericWorkbook
    .getWorksheet('Textos')
    .getColumn(1)
    .values.map((value) => String(value ?? ''));
  if (!staticKeys.includes('static.title') || !staticKeys.includes('static.pending')) {
    throw new Error('Genérico: las claves static.* no se asignaron a Textos.');
  }
  const genericHeaders = genericSummary.getRow(1).values.slice(1);
  if (genericHeaders.slice(0, 4).join(',') !== 'Clave,en,es,de') {
    throw new Error(`Genérico: columnas inesperadas ${genericHeaders.join(',')}.`);
  }
  if (genericGeneral.getColumn(1).width !== 38 || genericLanguages.some((_, index) => genericGeneral.getColumn(index + 2).width !== 24)) {
    throw new Error('Genérico: el export no respetó los anchos configurados.');
  }

  await fs.mkdir(fullLanguageDirectory, { recursive: true });
  const completeBefore = new Map();
  for (const language of languages) {
    const realCatalogue = JSON.parse(await fs.readFile(path.join(repo, 'public/assets/i18n', `${language}.json`), 'utf8'));
    completeBefore.set(language, flatten(realCatalogue));
    await fs.writeFile(path.join(fullLanguageDirectory, `${language}.json`), `${JSON.stringify(realCatalogue, null, 2)}\n`, 'utf8');
  }
  const completeWorkbook = new ExcelJS.Workbook();
  await completeWorkbook.xlsx.readFile(path.join(repo, 'docs/traducciones_agrupadas_urbanoa.xlsx'));
  const styledSheet = completeWorkbook.getWorksheet('Inicio y comunes');
  if (styledSheet.getCell('A1').fill?.fgColor?.argb !== 'FF548194' || styledSheet.getCell('A2').alignment?.wrapText !== true) {
    throw new Error('El export no conservó el encabezado ni el ajuste de texto de la plantilla.');
  }
  const completeSummary = completeWorkbook.getWorksheet('Resumen');
  if (completeSummary.rowCount !== completeBefore.get('es').size + 1) {
    throw new Error(`Resumen contiene ${completeSummary.rowCount} filas; esperaba encabezado + ${completeBefore.get('es').size} claves.`);
  }
  const sectionRows = completeSummary.getColumn(1).values.filter((value) => /^===/.test(String(value ?? '').trim()));
  if (sectionRows.length) {
    throw new Error(`Resumen contiene ${sectionRows.length} separadores internos inesperados.`);
  }
  const pendingRules = completeWorkbook.getWorksheet('Autenticación').conditionalFormattings.flatMap((formatting) => formatting.rules);
  for (const language of ['eu', 'fr', 'uk']) {
    if (!pendingRules.some((rule) => rule.type === 'expression' && rule.formulae?.some((formula) => formula.includes(`"${language}_"`)))) {
      throw new Error(`El export perdió el resaltado condicional para ${language}_.`);
    }
  }
  const completeHeaders = new Map();
  completeSummary.getRow(1).eachCell((cell, column) => {
    completeHeaders.set(
      String(cell.value ?? '')
        .trim()
        .toLowerCase(),
      column,
    );
  });
  const completedValues = new Map(languages.map((language) => [language, new Map()]));
  completeSummary.eachRow((row, number) => {
    if (number === 1) return;
    const key = String(row.getCell(1).value ?? '').trim();
    if (!key || /^===/.test(key)) return;
    for (const language of languages) {
      const cell = row.getCell(completeHeaders.get(language));
      if (!String(cell.value ?? '').trim()) {
        const value = `FULL_IMPORTED_${language.toUpperCase()}_${number}`;
        cell.value = value;
        completedValues.get(language).set(key, value);
      }
    }
  });
  await completeWorkbook.xlsx.writeFile(completedWorkbook);
  run('import', '--config', path.join(repo, 'i18n-excel.config.json'), '--input', completedWorkbook, '--langs', fullLanguageDirectory);
  for (const language of languages) {
    const after = flatten(JSON.parse(await fs.readFile(path.join(fullLanguageDirectory, `${language}.json`), 'utf8')));
    const before = completeBefore.get(language);
    const changed = [...new Set([...before.keys(), ...after.keys()])].filter((key) => before.get(key) !== after.get(key));
    const expectedChanges = [...completedValues.get(language).keys()].sort();
    if (changed.sort().join('\n') !== expectedChanges.join('\n')) {
      throw new Error(`${language}: cambios ${changed.join(', ')}; esperados ${expectedChanges.join(', ')}`);
    }
    for (const [key, value] of completedValues.get(language)) {
      if (after.get(key) !== value) {
        throw new Error(`${language}: ${key} no recibió la traducción completada.`);
      }
    }
  }

  console.log('Flujo JSON → Excel → JSON y reimportación completa verificados para es, eu, fr y uk.');
} finally {
  await fs.rm(temporaryRoot, { recursive: true, force: true });
}
