/**
 * Sincroniza ficheros JSON de @ngx-translate con un Excel editable por clientes.
 * No modifica JSON durante `export` ni `audit`; `import` valida antes de escribir.
 *
 * Uso: node scripts/i18n-excel.mjs <audit|export|import> [opciones]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ExcelJS from 'exceljs';
import ts from 'typescript';

const DEFAULT_CONFIG = {
  cataloguesDir: 'public/assets/i18n',
  sourceDir: 'src',
  referenceLanguage: 'es',
  requiredLanguages: [],
  catalogueStructure: 'nested',
  template: null,
  output: 'docs/traducciones.xlsx',
  auditOutput: 'docs/i18n-audit.json',
  literalsOutput: 'docs/i18n-direct-literals.md',
  summarySheet: 'Resumen',
  indexSheet: 'Índice',
  generalSheet: 'General',
  keyHeader: 'Clave',
  featureHeader: 'Funcionalidad',
  countHeader: 'Claves',
  keyColumnWidth: null,
  languageColumnWidth: null,
  featureColumnWidth: null,
  missingTranslationPattern: '{language}_{reference}',
  supportedExtensions: ['.html', '.ts'],
  excludedFileSuffixes: ['.spec.ts'],
  dynamicPrefixes: [],
  ignoredKeyPrefixes: [],
  translationKeyPrefixes: [],
  ignoredDirectLiterals: [],
};
let config = structuredClone(DEFAULT_CONFIG);

async function loadConfig(options) {
  const explicit = typeof options.config === 'string';
  const configFile = explicit ? options.config : 'i18n-excel.config.json';
  try {
    const loaded = JSON.parse(await fs.readFile(configFile, 'utf8'));
    config = { ...DEFAULT_CONFIG, ...loaded };
  } catch (error) {
    if (explicit || error.code !== 'ENOENT') throw error;
  }
  if (!Array.isArray(config.requiredLanguages)) {
    throw new Error('requiredLanguages debe ser un array.');
  }
  if (!Array.isArray(config.dynamicPrefixes)) {
    throw new Error('dynamicPrefixes debe ser un array.');
  }
  if (!Array.isArray(config.ignoredKeyPrefixes)) {
    throw new Error('ignoredKeyPrefixes debe ser un array.');
  }
  if (!Array.isArray(config.translationKeyPrefixes)) {
    throw new Error('translationKeyPrefixes debe ser un array.');
  }
  if (!Array.isArray(config.ignoredDirectLiterals)) {
    throw new Error('ignoredDirectLiterals debe ser un array.');
  }
  if (!['flat', 'nested'].includes(config.catalogueStructure)) {
    throw new Error('catalogueStructure debe ser "flat" o "nested".');
  }
  if (typeof config.missingTranslationPattern !== 'string') {
    throw new Error('missingTranslationPattern debe ser un texto.');
  }
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const item = rest[index];
    if (!item.startsWith('--')) continue;
    const [key, inlineValue] = item.slice(2).split('=', 2);
    options[key] = inlineValue ?? (!rest[index + 1] || rest[index + 1].startsWith('--') ? true : rest[++index]);
  }
  return { command, options };
}

function usage(exitCode = 0) {
  console.log(`
Uso:
  node scripts/i18n-excel.mjs audit [--config i18n-excel.config.json] [--langs public/assets/i18n] [--src src] [--excel archivo.xlsx]
  node scripts/i18n-excel.mjs sync [--langs public/assets/i18n]
  node scripts/i18n-excel.mjs prune [--langs public/assets/i18n] [--src src]
  node scripts/i18n-excel.mjs export --out docs/traducciones.xlsx [--template plantilla.xlsx] [--langs public/assets/i18n] [--src src] [--include-unused]
  node scripts/i18n-excel.mjs import --input docs/traducciones-revisadas.xlsx [--langs public/assets/i18n] [--allow-empty]

Los idiomas se obtienen de los nombres de los JSON (es.json, eu.json, fr.json...).
`);
  process.exit(exitCode);
}

async function filesRecursively(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const children = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return filesRecursively(fullPath);
      return config.supportedExtensions.includes(path.extname(entry.name)) &&
        !config.excludedFileSuffixes.some((suffix) => entry.name.endsWith(suffix))
        ? [fullPath]
        : [];
    }),
  );
  return children.flat();
}

function flatten(node, prefix = '', output = new Map()) {
  if (typeof node === 'string') output.set(prefix, node);
  else if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) flatten(value, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

function flattenCatalogue(node) {
  if (config.catalogueStructure === 'nested') return flatten(node);
  return new Map(Object.entries(node).filter(([, value]) => typeof value === 'string'));
}

function setCatalogueValue(target, key, value) {
  if (config.catalogueStructure === 'flat') target[key] = value;
  else setByPath(target, key, value);
}

function missingTranslationValue(language, referenceValue) {
  if (typeof referenceValue !== 'string') return structuredClone(referenceValue);
  return config.missingTranslationPattern.replaceAll('{language}', language).replaceAll('{reference}', referenceValue);
}

function isMissingTranslationPlaceholder(language, value, referenceValue) {
  return (
    language !== config.referenceLanguage &&
    typeof value === 'string' &&
    typeof referenceValue === 'string' &&
    value === missingTranslationValue(language, referenceValue)
  );
}

function setByPath(target, dottedKey, value) {
  const parts = dottedKey.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) current = current[part] ??= {};
  current[parts.at(-1)] = value;
}

function deleteByPath(target, dottedKey) {
  if (Object.prototype.hasOwnProperty.call(target, dottedKey)) {
    delete target[dottedKey];
    return;
  }
  const parts = dottedKey.split('.');
  const parents = [];
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!current || typeof current !== 'object' || !(part in current)) return;
    parents.push([current, part]);
    current = current[part];
  }
  delete current[parts.at(-1)];
  for (const [parent, part] of parents.reverse()) {
    const child = parent[part];
    if (child && typeof child === 'object' && !Array.isArray(child) && !Object.keys(child).length) {
      delete parent[part];
    } else {
      break;
    }
  }
}

function canSetByPath(target, dottedKey) {
  let current = target;
  for (const part of dottedKey.split('.').slice(0, -1)) {
    if (!(part in current)) return true;
    if (!current[part] || typeof current[part] !== 'object' || Array.isArray(current[part])) {
      return false;
    }
    current = current[part];
  }
  return true;
}

function normalizeDottedKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { value, normalized: 0 };
  }
  const output = {};
  let normalized = 0;
  for (const [key, child] of Object.entries(value).filter(([key]) => !key.includes('.'))) {
    const result = normalizeDottedKeys(child);
    output[key] = result.value;
    normalized += result.normalized;
  }
  for (const [key, child] of Object.entries(value).filter(([key]) => key.includes('.'))) {
    const result = normalizeDottedKeys(child);
    if (canSetByPath(output, key)) {
      setByPath(output, key, result.value);
      normalized += result.normalized + 1;
    } else {
      output[key] = result.value;
      normalized += result.normalized;
    }
  }
  return { value: output, normalized };
}

async function loadCatalogues(languageDirectory) {
  const names = (await fs.readdir(languageDirectory))
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => {
      const languageA = path.basename(a, '.json');
      const languageB = path.basename(b, '.json');
      const indexA = config.requiredLanguages.indexOf(languageA);
      const indexB = config.requiredLanguages.indexOf(languageB);
      if (indexA >= 0 || indexB >= 0) {
        if (indexA < 0) return 1;
        if (indexB < 0) return -1;
        return indexA - indexB;
      }
      return a.localeCompare(b);
    });
  if (!names.length) throw new Error(`No hay JSON de idiomas en ${languageDirectory}.`);
  const catalogues = new Map();
  for (const name of names) {
    const language = path.basename(name, '.json');
    const source = await fs.readFile(path.join(languageDirectory, name), 'utf8');
    const data = JSON.parse(source);
    catalogues.set(language, {
      file: path.join(languageDirectory, name),
      data,
      flat: flattenCatalogue(data),
    });
  }
  const missingLanguages = config.requiredLanguages.filter((language) => !catalogues.has(language));
  if (missingLanguages.length) {
    throw new Error(`Faltan catálogos obligatorios: ${missingLanguages.join(', ')}.`);
  }
  return catalogues;
}

function extractTranslationKeys(content) {
  const keys = new Set();
  const expressions = [
    /['\"]([^'\"`]+)['\"]\s*\|\s*translate\b/g,
    /\b(?:this\.)?(?:translationService|translateService)\s*(?:\?\.|\.)\s*(?:translate|instant|get|stream)\s*\(\s*['\"]([^'\"`]+)['\"]/g,
    /\btranslate\s*\(\s*['\"]([^'\"`]+)['\"]/g,
  ];
  for (const expression of expressions)
    for (const match of content.matchAll(expression)) {
      if (/^(?!\.\.\.$)(?!.*\.$)[\w-]+(?:\.[\w-]+)*$/.test(match[1])) keys.add(match[1]);
    }
  return keys;
}

function extractPotentialTranslationKeys(content, relativePath) {
  const keys = new Set();
  const prefixes = new Set();
  if (!relativePath.endsWith('.ts') || /[\\/]environments[\\/]/i.test(relativePath)) {
    return { keys, prefixes };
  }
  for (const match of content.matchAll(/['\"]((?!\.\.\.$)(?!.*\.$)[\w-]+(?:\.[\w-]+)+)['\"]/g)) {
    const value = match[1];
    const acceptedPrefix =
      !config.translationKeyPrefixes.length ||
      config.translationKeyPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}.`));
    if (acceptedPrefix && !/^v?\d+(?:\.\d+)+$/i.test(value) && !/\.(?:ts|html|css|scss|svg|png|jpe?g|json|mjs)$/i.test(value)) {
      keys.add(value);
    }
  }
  const source = ts.createSourceFile(relativePath, content, ts.ScriptTarget.Latest, true);
  const addKey = (value, node) => {
    const parent = node.parent;
    if (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) return;
    if (/^(?:\.{0,2}\/|https?:\/\/)/.test(value)) return;
    if (/^v?\d+(?:\.\d+)+$/i.test(value)) return;
    if (/\.(?:ts|html|css|scss|svg|png|jpe?g|json|mjs)$/i.test(value)) return;
    if (/^(?!\.\.\.$)(?!.*\.$)[\w-]+(?:\.[\w-]+)+$/.test(value)) keys.add(value);
  };
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      addKey(node.text, node);
    }
    if (ts.isTemplateExpression(node)) {
      const prefix = node.head.text.trim();
      if (/^[\w-]+(?:\.[\w-]+)*\.$/.test(prefix)) prefixes.add(prefix);
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      for (const operand of [node.left, node.right]) {
        if (ts.isStringLiteral(operand) && /^[\w-]+(?:\.[\w-]+)*\.$/.test(operand.text)) {
          prefixes.add(operand.text);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { keys, prefixes };
}

function maskComments(content, extension) {
  const commentPattern = extension === '.html' ? /<!--[\s\S]*?-->/g : /\/\*[\s\S]*?\*\/|\/\/[^\n\r]*/g;
  return content.replace(commentPattern, (comment) => comment.replace(/[^\r\n]/g, ' '));
}

function findDirectLiterals(content, relativePath) {
  const findings = [];
  const ignoredDirectLiterals = new Set(config.ignoredDirectLiterals);
  const isNonTranslatable = (value) => {
    const text = value.replace(/\s+/g, ' ').trim();
    return (
      !text ||
      ignoredDirectLiterals.has(text) ||
      /^https?:\/\//i.test(text) ||
      /^https?:$/i.test(text) ||
      /^[/#$<]/.test(text) ||
      (/^[Mm][MmLlHhVvCcSsQqTtAaZz0-9+\-.,\s]+$/.test(text) && text.length > 40) ||
      /^(?::host|\.[\w-]+(?:\s*,\s*\.[\w-]+)*)\s*\{?/.test(text) ||
      /^var\(--[\w-]+\)$/.test(text) ||
      /^(?:xMidYMid meet|ExtendedData \w+|&(?:amp|lt|gt|quot|copy);.*)$/i.test(text) ||
      /(?:^|\s)[\w.+-]+@[\w.-]+\.[a-z]{2,}(?:\s|$)/i.test(text) ||
      /(?:&#(?:64|commat);|&commat;)/i.test(text) ||
      /^@[a-z]+\b|=>|\|\||&&|===|!==|\[class\]/.test(text) ||
      /^[a-z]+(?:_[a-z]+)+$/.test(text) || // nombre de icono Material, p. ej. "credit_card"
      /^(?:visa|amex|mastercard|american express|facebook|instagram|twitter|google play|app store|cvv\s*\/\s*cvc)$/i.test(text) ||
      /^(?:schedule|notifications|contactless|close)$/i.test(text) ||
      /^(?:\((?:U[123]|PMR)\)|payment \*|text\/html,application\/xhtml\+xml)$/i.test(text) ||
      /^(?:No 3DS script|3DS authentication timed out)$/i.test(text) ||
      /^(?:Izenik gabeko\/|Gazteak\/|FU (?:20|50)(?:\+|\/))/i.test(text) ||
      /^(?:Español|Euskera|English|Français)$/i.test(text) ||
      /^(?:Donostia, Motora Pasaia|Irun y Errenteria|Eibar, Zarautz, Arrasate, Hernani, Tolosa, Lasarte-Oria, Oñati y Oiartzun)$/i.test(
        text,
      ) ||
      /^(?:de )?\d{1,2}:\d{2}h?(?:\s*(?:-|a)\s*\d{1,2}:\d{2}h?)?$/i.test(text) ||
      /^\d+\s*h(?:\s+\d+\s*min)?$|^\d+\s*min$/i.test(text) ||
      /^\d{4}\s*[A-Z]{3}$|^(?:visa|mastercard)\s*[•*]+\s*\d{4}$/i.test(text) ||
      /\b\d{5}\b.*\b(?:Donostia|San Sebasti[aá]n)\b/i.test(text) || // dirección postal
      /\b(?:bg|text|border|flex|grid|p|px|py|m|mx|my|h|w|rounded|shadow|items|justify|hover|animate)-[\w[\]/.-]+/.test(text) || // clases CSS/Tailwind
      /(?:rgba?\(|\b(?:min|max|calc)\(|\d+px|stroke-(?:linecap|linejoin))/.test(text)
    );
  };
  const add = (index, text, kind) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (
      !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalized) ||
      normalized.length < 2 ||
      /{{|}}|^\*ng|^class=/.test(normalized) ||
      isNonTranslatable(normalized)
    )
      return;
    const line = content.slice(0, index).split('\n').length;
    findings.push({ file: relativePath.replaceAll('\\', '/'), line, kind, text: normalized });
  };
  if (relativePath.endsWith('.html')) {
    for (const match of content.matchAll(/>([^<>{}]+)</g)) add(match.index + 1, match[1], 'html-text');
    for (const match of content.matchAll(/(?:aria-label|title|placeholder|alt)\s*=\s*["']([^"']+)["']/gi))
      add(match.index, match[1], 'html-attribute');
  } else {
    if (/[\\/](?:models[\\/]enum|config[\\/]Constants)\b|\.dto\.ts$/i.test(relativePath)) return findings;
    const source = ts.createSourceFile(relativePath, content, ts.ScriptTarget.Latest, true);
    for (const match of content.matchAll(/\btemplate\s*:\s*`([\s\S]*?)`/g)) {
      const template = match[1];
      const start = match.index + match[0].indexOf(template);
      for (const textMatch of template.matchAll(/>([^<>{}]+)</g)) {
        add(start + textMatch.index + 1, textMatch[1], 'inline-html-text');
      }
      for (const attributeMatch of template.matchAll(/(?:aria-label|title|placeholder|alt)\s*=\s*["']([^"']+)["']/gi)) {
        add(start + attributeMatch.index, attributeMatch[1], 'inline-html-attribute');
      }
    }
    const isErrorConstructorArgument = (node) => {
      let current = node.parent;
      while (current && !ts.isStatement(current)) {
        if (ts.isNewExpression(current) && ts.isIdentifier(current.expression) && current.expression.text === 'Error') return true;
        current = current.parent;
      }
      return false;
    };
    const isWithinConsoleCall = (node) => {
      let current = node.parent;
      while (current && !ts.isStatement(current)) {
        if (
          ts.isCallExpression(current) &&
          ts.isPropertyAccessExpression(current.expression) &&
          ts.isIdentifier(current.expression.expression) &&
          current.expression.expression.text === 'console'
        )
          return true;
        current = current.parent;
      }
      return false;
    };
    const isControlOrDomainLiteral = (node) => {
      let current = node.parent;
      while (current && !ts.isStatement(current)) {
        if (ts.isEnumMember(current)) return true;
        if (
          (ts.isVariableDeclaration(current) || ts.isPropertyDeclaration(current)) &&
          ts.isIdentifier(current.name) &&
          /^[A-Z][A-Z0-9_]*$/.test(current.name.text)
        )
          return true;
        if (ts.isBinaryExpression(current)) {
          const comparisonOperators = new Set([
            ts.SyntaxKind.EqualsEqualsToken,
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            ts.SyntaxKind.ExclamationEqualsToken,
            ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ]);
          if (comparisonOperators.has(current.operatorToken.kind)) return true;
        }
        if (
          ts.isCallExpression(current) &&
          ts.isPropertyAccessExpression(current.expression) &&
          /^(?:includes|startsWith|endsWith|indexOf|split)$/.test(current.expression.name.text)
        )
          return true;
        current = current.parent;
      }
      return false;
    };
    const visit = (node) => {
      if (ts.isStringLiteral(node)) {
        const value = node.text;
        const parent = node.parent;
        const isModuleReference = ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent);
        if (
          !isModuleReference &&
          !isWithinConsoleCall(node) &&
          !isErrorConstructorArgument(node) &&
          !isControlOrDomainLiteral(node) &&
          !/^[\w$./:@=-]+$/.test(value) &&
          !value.includes('translate') &&
          !value.startsWith('./') &&
          !value.startsWith('../') &&
          !value.startsWith('/')
        ) {
          add(node.getStart(source), value, 'ts-string');
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return findings;
}

async function scanSource(sourceDirectory) {
  const files = await filesRecursively(sourceDirectory);
  const keys = new Set();
  const dynamicPrefixes = new Set(config.dynamicPrefixes);
  const objectLookupPrefixes = new Set();
  const literals = [];
  const isIgnoredKey = (key) => config.ignoredKeyPrefixes.some((prefix) => key.startsWith(prefix));
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    const contentWithoutComments = maskComments(content, path.extname(file));
    const translationKeys = extractTranslationKeys(contentWithoutComments);
    translationKeys.forEach((key) => {
      if (isIgnoredKey(key)) return;
      keys.add(key);
      if (config.catalogueStructure === 'nested') objectLookupPrefixes.add(`${key}.`);
    });
    const potential = extractPotentialTranslationKeys(contentWithoutComments, path.relative(process.cwd(), file));
    potential.keys.forEach((key) => {
      if (!isIgnoredKey(key)) keys.add(key);
    });
    potential.prefixes.forEach((prefix) => dynamicPrefixes.add(prefix));
    literals.push(...findDirectLiterals(contentWithoutComments, path.relative(process.cwd(), file)));
  }
  return { keys, dynamicPrefixes, objectLookupPrefixes, literals };
}

function isSourceKeyUsed(source, key) {
  return (
    source.keys.has(key) ||
    [...source.objectLookupPrefixes].some((prefix) => key.startsWith(prefix)) ||
    [...source.dynamicPrefixes].some((prefix) => key.startsWith(prefix))
  );
}

async function readExcelRows(input) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(input);
  const sheet = workbook.getWorksheet(config.summarySheet) ?? workbook.worksheets[0];
  if (!sheet) throw new Error('El Excel no tiene hojas.');
  const headers = new Map();
  sheet.getRow(1).eachCell((cell, index) =>
    headers.set(
      String(cell.value ?? '')
        .trim()
        .toLowerCase(),
      index,
    ),
  );
  const keyColumn = headers.get('clave') ?? headers.get('key');
  if (!keyColumn) throw new Error('No se encuentra la columna Clave/Key en la primera fila.');
  const languageColumns = [...headers.entries()]
    .filter(([name]) => /^[a-z]{2,3}(?:-[a-z]{2})?$/i.test(name))
    .map(([language, column]) => ({ language, column }));
  const rows = [];
  const textValue = (cell) => (typeof cell.value === 'string' ? cell.value : cell.value == null ? '' : String(cell.value));
  sheet.eachRow((row, number) => {
    if (number === 1) return;
    const key = textValue(row.getCell(keyColumn)).trim();
    if (!key || /^===/.test(key)) return;
    rows.push({
      number,
      key,
      values: Object.fromEntries(languageColumns.map(({ language, column }) => [language, textValue(row.getCell(column))])),
    });
  });
  return { rows, languages: languageColumns.map(({ language }) => language), sheetName: sheet.name };
}

function featureFor(key) {
  const first = key.split('.')[0].replaceAll(/[-_]/g, ' ');
  return first ? first[0].toUpperCase() + first.slice(1) : config.generalSheet;
}

function hasTranslationPath(catalogue, dottedKey) {
  if (config.catalogueStructure === 'flat') {
    return Object.prototype.hasOwnProperty.call(catalogue, dottedKey) && typeof catalogue[dottedKey] === 'string';
  }
  return dottedKey.split('.').every((part) => {
    if (!catalogue || typeof catalogue !== 'object' || !(part in catalogue)) return false;
    catalogue = catalogue[part];
    return true;
  });
}

function markdownDirectLiteralReport(literals) {
  const escape = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
  // Agrupar sin perder la ruta permite revisar el código de arriba abajo.
  const byFile = new Map();
  for (const literal of literals) (byFile.get(literal.file) ?? byFile.set(literal.file, []).get(literal.file)).push(literal);
  const lines = [
    '# Candidatos de textos directos para i18n',
    '',
    `Total: **${literals.length}**. Son candidatos revisables: no incluyen comentarios, logs, clases CSS, iconos, URLs, correos, direcciones, horarios ni marcas.`,
    '',
    'Antes de migrar una fila, confirmar que se muestra al usuario. Si lo hace, crear una clave, sustituir el literal por la traducción y regenerar el Excel.',
  ];
  for (const [file, items] of [...byFile.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push('', `## ${file}`, '', '| Línea | Tipo | Texto |', '| ---: | --- | --- |');
    for (const item of items.sort((a, b) => a.line - b.line)) lines.push(`| ${item.line} | ${item.kind} | ${escape(item.text)} |`);
  }
  return `${lines.join('\n')}\n`;
}

async function audit(options) {
  const languageDirectory = options.langs ?? config.cataloguesDir;
  const sourceDirectory = options.src ?? config.sourceDir;
  const [catalogues, source] = await Promise.all([loadCatalogues(languageDirectory), scanSource(sourceDirectory)]);
  const referenceLanguage = catalogues.has(config.referenceLanguage) ? config.referenceLanguage : catalogues.keys().next().value;
  const referenceKeys = new Set(catalogues.get(referenceLanguage).flat.keys());
  const missingInCatalogues = {};
  for (const [language, catalogue] of catalogues)
    missingInCatalogues[language] = [...referenceKeys].filter((key) => !catalogue.flat.has(key));
  const orphanKeysOutsideReference = {};
  for (const [language, catalogue] of catalogues) {
    orphanKeysOutsideReference[language] =
      language === referenceLanguage ? [] : [...catalogue.flat.keys()].filter((key) => !referenceKeys.has(key)).sort();
  }
  const emptyInCatalogues = {};
  const placeholderInCatalogues = {};
  for (const [language, catalogue] of catalogues) {
    emptyInCatalogues[language] = [...referenceKeys].filter((key) => {
      const value = catalogue.flat.get(key);
      return typeof value === 'string' && !value.trim();
    });
    placeholderInCatalogues[language] = [...referenceKeys].filter((key) =>
      isMissingTranslationPlaceholder(language, catalogue.flat.get(key), catalogues.get(referenceLanguage).flat.get(key)),
    );
  }
  const sourceKeysMissing = [...source.keys].filter((key) => !hasTranslationPath(catalogues.get(referenceLanguage).data, key)).sort();
  const usedReferenceKeys = [...referenceKeys].filter((key) => isSourceKeyUsed(source, key));
  const missingUsedInCatalogues = {};
  const emptyUsedInCatalogues = {};
  const placeholderUsedInCatalogues = {};
  for (const [language, catalogue] of catalogues) {
    missingUsedInCatalogues[language] = usedReferenceKeys.filter((key) => !catalogue.flat.has(key)).sort();
    emptyUsedInCatalogues[language] = usedReferenceKeys
      .filter((key) => {
        const value = catalogue.flat.get(key);
        return typeof value === 'string' && !value.trim();
      })
      .sort();
    placeholderUsedInCatalogues[language] = usedReferenceKeys
      .filter((key) => isMissingTranslationPlaceholder(language, catalogue.flat.get(key), catalogues.get(referenceLanguage).flat.get(key)))
      .sort();
  }
  const report = {
    referenceLanguage,
    sourceKeys: usedReferenceKeys.length,
    dynamicPrefixes: [...source.dynamicPrefixes].sort(),
    objectLookupPrefixes: [...source.objectLookupPrefixes].sort(),
    catalogueKeys: referenceKeys.size,
    usedKeysMissingInReference: sourceKeysMissing,
    referenceKeysUnusedInSource: [...referenceKeys].filter((key) => !isSourceKeyUsed(source, key)).sort(),
    missingInCatalogues,
    orphanKeysOutsideReference,
    emptyInCatalogues,
    placeholderInCatalogues,
    missingUsedInCatalogues,
    emptyUsedInCatalogues,
    placeholderUsedInCatalogues,
    directLiterals: source.literals,
  };
  if (options.excel) {
    const excel = await readExcelRows(options.excel);
    const excelKeys = new Set(excel.rows.map((row) => row.key));
    report.excel = {
      sheet: excel.sheetName,
      rows: excel.rows.length,
      excelOnly: [...excelKeys].filter((key) => !isSourceKeyUsed(source, key)).sort(),
      sourceMissingInExcel: usedReferenceKeys.filter((key) => !excelKeys.has(key)).sort(),
    };
  }
  const output = options.out ?? config.auditOutput;
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(report, null, 2)}\n`);
  const directLiteralsOutput = options.literalsOut ?? config.literalsOutput;
  await fs.writeFile(directLiteralsOutput, markdownDirectLiteralReport(report.directLiterals));
  console.log(`Auditoría guardada en ${output}`);
  console.log(`Listado de candidatos guardado en ${directLiteralsOutput}`);
  console.log(
    `Claves usadas: ${report.sourceKeys}; faltantes: ${report.usedKeysMissingInReference.length}; literales directos candidatos: ${report.directLiterals.length}.`,
  );
  const structureErrors = Object.entries(report.missingInCatalogues)
    .filter(([language, keys]) => language !== referenceLanguage && keys.length)
    .map(([language, keys]) => `${language}: faltan ${keys.length}`);
  for (const [language, keys] of Object.entries(report.orphanKeysOutsideReference)) {
    if (keys.length) structureErrors.push(`${language}: sobran ${keys.length}`);
  }
  if (structureErrors.length) {
    throw new Error(`Catálogos desincronizados respecto a ${referenceLanguage}: ${structureErrors.join('; ')}. Ejecuta npm run i18n:sync.`);
  }
  if (report.referenceKeysUnusedInSource.length && !options['include-unused'] && !options['allow-unused']) {
    throw new Error(
      `es.json contiene ${report.referenceKeysUnusedInSource.length} claves sin uso respaldado en el código. Ejecuta npm run i18n:prune.`,
    );
  }
  if (report.excel && (report.excel.excelOnly.length || report.excel.sourceMissingInExcel.length)) {
    throw new Error(
      `El Excel no coincide con el código: sobran ${report.excel.excelOnly.length} y faltan ${report.excel.sourceMissingInExcel.length} claves. Ejecuta npm run i18n:excel.`,
    );
  }
  return { catalogues, source, report };
}

async function syncCatalogues(options) {
  const languageDirectory = options.langs ?? config.cataloguesDir;
  const catalogues = await loadCatalogues(languageDirectory);
  const normalizedCatalogues = new Map();
  for (const [language, catalogue] of catalogues) {
    const result =
      config.catalogueStructure === 'flat'
        ? { value: structuredClone(catalogue.data), normalized: 0 }
        : normalizeDottedKeys(catalogue.data);
    normalizedCatalogues.set(language, {
      ...catalogue,
      data: result.value,
      flat: flattenCatalogue(result.value),
      normalized: result.normalized,
    });
  }
  const reference = normalizedCatalogues.get(config.referenceLanguage);
  if (!reference) throw new Error(`No existe el catálogo maestro ${config.referenceLanguage}.json.`);
  const referenceKeys = new Set(reference.flat.keys());
  for (const [language, catalogue] of catalogues) {
    const normalizedCatalogue = normalizedCatalogues.get(language);
    const updated = structuredClone(normalizedCatalogue.data);
    const missing = language === config.referenceLanguage ? [] : [...referenceKeys].filter((key) => !normalizedCatalogue.flat.has(key));
    const orphan =
      language === config.referenceLanguage ? [] : [...normalizedCatalogue.flat.keys()].filter((key) => !referenceKeys.has(key));
    for (const key of missing) {
      const referenceValue = reference.flat.get(key);
      setCatalogueValue(updated, key, missingTranslationValue(language, referenceValue));
    }
    for (const key of orphan) deleteByPath(updated, key);
    if (normalizedCatalogue.normalized || missing.length || orphan.length) {
      await fs.writeFile(catalogue.file, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    }
    console.log(`${language}: normalizadas ${normalizedCatalogue.normalized}; añadidas ${missing.length}; eliminadas ${orphan.length}.`);
  }
}

async function pruneCatalogues(options) {
  await syncCatalogues(options);
  const languageDirectory = options.langs ?? config.cataloguesDir;
  const sourceDirectory = options.src ?? config.sourceDir;
  const [catalogues, source] = await Promise.all([loadCatalogues(languageDirectory), scanSource(sourceDirectory)]);
  const reference = catalogues.get(config.referenceLanguage);
  if (!reference) throw new Error(`No existe el catálogo maestro ${config.referenceLanguage}.json.`);
  const unused = [...reference.flat.keys()].filter((key) => !isSourceKeyUsed(source, key)).sort();
  for (const [language, catalogue] of catalogues) {
    const updated = structuredClone(catalogue.data);
    for (const key of unused) deleteByPath(updated, key);
    if (unused.length) {
      await fs.writeFile(catalogue.file, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    }
    console.log(`${language}: eliminadas ${unused.length} claves sin uso.`);
  }
}

async function exportWorkbook(options) {
  options.out ??= config.output;
  if (!options.out) throw new Error('export requiere --out <archivo.xlsx> o config.output.');
  const result = await audit({ ...options, out: options.auditOut ?? config.auditOutput });
  const { catalogues, source } = result;
  const languages = [...catalogues.keys()];
  const reference = catalogues.get(catalogues.has(config.referenceLanguage) ? config.referenceLanguage : languages[0]).flat;
  const keys = (
    options['include-unused'] ? [...reference.keys()] : [...reference.keys()].filter((key) => isSourceKeyUsed(source, key))
  ).sort((a, b) => a.localeCompare(b));
  const template = options.template ?? config.template;
  const workbook = new ExcelJS.Workbook();
  if (template) {
    await fs.access(template);
    await workbook.xlsx.readFile(template);
  } else {
    const summary = workbook.addWorksheet(config.summarySheet);
    const general = workbook.addWorksheet(config.generalSheet);
    const index = workbook.addWorksheet(config.indexSheet);
    for (const sheet of [summary, general, index]) {
      sheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];
      sheet.getRow(1).height = 26;
      sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F766E' },
      };
    }
    summary.columns = [
      { width: config.keyColumnWidth ?? 44 },
      ...languages.map(() => ({ width: config.languageColumnWidth ?? 28 })),
      { width: config.featureColumnWidth ?? 24 },
    ];
    general.columns = [{ width: config.keyColumnWidth ?? 44 }, ...languages.map(() => ({ width: config.languageColumnWidth ?? 28 }))];
    index.columns = [{ width: 34 }, { width: 14 }];
  }
  const summary = workbook.getWorksheet(config.summarySheet);
  const index = workbook.getWorksheet(config.indexSheet);
  if (!summary || !index) {
    throw new Error(`La plantilla debe contener las hojas ${config.summarySheet} y ${config.indexSheet}.`);
  }
  const functionalSheets = workbook.worksheets.filter((sheet) => sheet !== summary && sheet !== index);
  const setRowValuesPreservingStyle = (sheet, rowNumber, values) => {
    const row = sheet.getRow(rowNumber);
    const rowStyle = structuredClone(row.style);
    const cellStyles = values.map((_, index) => structuredClone(row.getCell(index + 1).style));
    row.values = values;
    row.style = rowStyle;
    for (let index = 0; index < cellStyles.length; index += 1) {
      row.getCell(index + 1).style = cellStyles[index];
    }
    if (rowNumber > 1 && cellStyles.some((style) => style.alignment?.wrapText)) {
      const lines = values.reduce((maximum, value, index) => {
        const width = sheet.getColumn(index + 1).width ?? 24;
        const text = String(value ?? '');
        const estimated = text
          .split(/\r?\n/)
          .reduce((total, part) => total + Math.max(1, Math.ceil(part.length / Math.max(8, width * 0.9))), 0);
        return Math.max(maximum, estimated);
      }, 1);
      row.height = Math.min(120, Math.max(24, lines * 15 + 4));
    }
  };
  setRowValuesPreservingStyle(summary, 1, [config.keyHeader, ...languages, config.featureHeader]);
  setRowValuesPreservingStyle(index, 1, [config.featureHeader, config.countHeader]);
  for (const sheet of functionalSheets) {
    setRowValuesPreservingStyle(sheet, 1, [config.keyHeader, ...languages]);
  }
  const applyConfiguredWidths = (sheet, includeFeature = false) => {
    if (Number.isFinite(config.keyColumnWidth)) {
      sheet.getColumn(1).width = config.keyColumnWidth;
    }
    if (Number.isFinite(config.languageColumnWidth)) {
      for (let index = 0; index < languages.length; index += 1) {
        sheet.getColumn(index + 2).width = config.languageColumnWidth;
      }
    }
    if (includeFeature && Number.isFinite(config.featureColumnWidth)) {
      sheet.getColumn(languages.length + 2).width = config.featureColumnWidth;
    }
  };
  applyConfiguredWidths(summary, true);
  for (const sheet of functionalSheets) applyConfiguredWidths(sheet);
  const originalSheetForKey = new Map();
  for (const sheet of functionalSheets)
    sheet.eachRow((row, number) => {
      if (number === 1) return;
      const key = String(row.getCell(1).value ?? '').trim();
      if (key && !/^===/.test(key)) originalSheetForKey.set(key, sheet.name);
    });
  const keysBySheet = new Map(functionalSheets.map((sheet) => [sheet.name, []]));
  if (!keysBySheet.has(config.generalSheet)) {
    throw new Error(`La plantilla debe contener la hoja general ${config.generalSheet}.`);
  }
  for (const key of keys) {
    keysBySheet.get(originalSheetForKey.get(key) ?? config.generalSheet).push(key);
  }

  const replaceAfterHeader = (sheet, rows) => {
    const existingRows = Math.max(0, sheet.rowCount - 1);
    const sharedRows = Math.min(existingRows, rows.length);

    // Sobrescribir las filas existentes conserva el formato de la plantilla.
    for (let index = 0; index < sharedRows; index += 1) {
      setRowValuesPreservingStyle(sheet, index + 2, rows[index]);
    }
    // ExcelJS 4.x no elimina correctamente un bloque completo con un único
    // spliceRows(2, count) en esta plantilla. Eliminar de abajo hacia arriba sí.
    for (let rowNumber = existingRows + 1; rowNumber > rows.length + 1; rowNumber -= 1) {
      sheet.spliceRows(rowNumber, 1);
    }
    // Si aparecen más claves que filas disponibles, heredar el estilo anterior.
    for (let index = sharedRows; index < rows.length; index += 1) {
      sheet.addRow(rows[index], 'i');
    }
  };
  const languageValues = (key) => languages.map((language) => catalogues.get(language).flat.get(key) ?? '');
  for (const sheet of functionalSheets) {
    replaceAfterHeader(
      sheet,
      keysBySheet.get(sheet.name).map((key) => [key, ...languageValues(key)]),
    );
  }

  const summaryRows = [];
  for (const sheet of functionalSheets) {
    const sheetKeys = keysBySheet.get(sheet.name);
    summaryRows.push([`=== ${sheet.name} (${sheetKeys.length} claves) ===`]);
    for (const key of sheetKeys) summaryRows.push([key, ...languageValues(key), sheet.name]);
  }
  replaceAfterHeader(summary, summaryRows);

  let total = 0;
  const indexRows = [];
  for (const sheet of functionalSheets) {
    const count = keysBySheet.get(sheet.name).length;
    total += count;
    indexRows.push([sheet.name, count]);
  }
  indexRows.push(['TOTAL', total]);
  replaceAfterHeader(index, indexRows);
  // El cliente reconoce la plantilla por este orden: Resumen primero e Índice siempre al final.
  workbook.worksheets.forEach((sheet, position) => {
    sheet.orderNo = position;
  });
  await fs.mkdir(path.dirname(options.out), { recursive: true });
  await workbook.xlsx.writeFile(options.out);
  console.log(`Excel exportado: ${options.out} (${keys.length} claves activas).`);
}

async function importWorkbook(options) {
  if (!options.input) throw new Error('import requiere --input <archivo.xlsx>.');
  const languageDirectory = options.langs ?? config.cataloguesDir;
  const catalogues = await loadCatalogues(languageDirectory);
  const excel = await readExcelRows(options.input);
  const errors = [];
  const missingExcelLanguages = config.requiredLanguages.filter((language) => !excel.languages.includes(language));
  if (missingExcelLanguages.length) {
    errors.push(`faltan columnas de idioma obligatorias: ${missingExcelLanguages.join(', ')}`);
  }
  const seen = new Set();
  for (const row of excel.rows) {
    if (!/^[\w.-]+$/.test(row.key)) errors.push(`Fila ${row.number}: clave inválida «${row.key}».`);
    if (seen.has(row.key)) errors.push(`Fila ${row.number}: clave duplicada «${row.key}».`);
    seen.add(row.key);
    for (const language of excel.languages) {
      if (!catalogues.has(language)) continue;
      if (!options['allow-empty'] && !row.values[language].trim()) {
        errors.push(`Fila ${row.number}: traducción vacía para ${language}.`);
      }
    }
  }
  if (errors.length)
    throw new Error(
      `Importación cancelada; corrige el Excel:\n- ${errors.slice(0, 25).join('\n- ')}${errors.length > 25 ? `\n- … y ${errors.length - 25} más.` : ''}`,
    );
  for (const [language, catalogue] of catalogues) {
    if (!excel.languages.includes(language)) continue;
    const updated = structuredClone(catalogue.data);
    for (const row of excel.rows) {
      const value = row.values[language];
      if (value || options['allow-empty']) setCatalogueValue(updated, row.key, value);
    }
    await fs.writeFile(catalogue.file, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
    console.log(`Actualizado ${catalogue.file}`);
  }
}

try {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || ['--help', '-h', 'help'].includes(command)) usage();
  await loadConfig(options);
  if (command === 'audit') await audit(options);
  else if (command === 'sync') await syncCatalogues(options);
  else if (command === 'prune') await pruneCatalogues(options);
  else if (command === 'export') await exportWorkbook(options);
  else if (command === 'import') await importWorkbook(options);
  else usage(1);
} catch (error) {
  console.error(error?.stack ?? `Error: ${error.message}`);
  process.exitCode = 1;
}
