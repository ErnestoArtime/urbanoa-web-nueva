import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const i18nDir = join(process.cwd(), 'public', 'assets', 'i18n');
const srcDir = join(process.cwd(), 'src');
const files = readdirSync(i18nDir).filter((name) => name.endsWith('.json')).sort();

if (!files.includes('es.json')) {
  console.error('Missing baseline locale file: es.json');
  process.exit(1);
}

const parseJson = (fileName) => {
  const filePath = join(i18nDir, fileName);
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Invalid JSON in ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

const baseLocale = 'es.json';
const baseKeys = new Set(Object.keys(parseJson(baseLocale)));

const collectFiles = (dir, matcher, output = []) => {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const absolutePath = join(dir, entry);
    const stats = statSync(absolutePath);
    if (stats.isDirectory()) {
      collectFiles(absolutePath, matcher, output);
      continue;
    }
    if (matcher(absolutePath)) {
      output.push(absolutePath);
    }
  }
  return output;
};

const readUsedKeys = () => {
  const filesToScan = collectFiles(
    srcDir,
    (filePath) => filePath.endsWith('.html') || filePath.endsWith('.ts')
  );

  const keys = new Set();
  const pipePattern = /['"`]([^'"`]+)['"`]\s*\|\s*translate\b/g;
  const callPattern = /\btranslate\(\s*['"`]([^'"`]+)['"`]/g;

  for (const filePath of filesToScan) {
    const content = readFileSync(filePath, 'utf8');

    for (const match of content.matchAll(pipePattern)) {
      keys.add(match[1]);
    }

    for (const match of content.matchAll(callPattern)) {
      keys.add(match[1]);
    }
  }

  return keys;
};

let hasIssues = false;

for (const file of files) {
  if (file === baseLocale) {
    continue;
  }

  const keys = new Set(Object.keys(parseJson(file)));
  const missing = [...baseKeys].filter((key) => !keys.has(key)).sort();
  const extra = [...keys].filter((key) => !baseKeys.has(key)).sort();

  if (missing.length === 0 && extra.length === 0) {
    console.log(`${file}: OK`);
    continue;
  }

  hasIssues = true;
  console.log(`\n${file}:`);

  if (missing.length > 0) {
    console.log('  Missing keys:');
    for (const key of missing) {
      console.log(`    - ${key}`);
    }
  }

  if (extra.length > 0) {
    console.log('  Extra keys:');
    for (const key of extra) {
      console.log(`    + ${key}`);
    }
  }
}

if (hasIssues) {
  console.log('\nLocale parity check: FAILED');
} else {
  console.log('\nLocale parity check: OK');
}

const usedKeys = readUsedKeys();
const missingInBase = [...usedKeys].filter((key) => !baseKeys.has(key)).sort();
const unusedInBase = [...baseKeys].filter((key) => !usedKeys.has(key)).sort();

if (missingInBase.length > 0) {
  hasIssues = true;
  console.log('\nMissing keys in es.json (used in src):');
  for (const key of missingInBase) {
    console.log(`  - ${key}`);
  }
}

console.log(`\nUsed keys found in src: ${usedKeys.size}`);
console.log(`Keys in es.json: ${baseKeys.size}`);

if (unusedInBase.length > 0) {
  console.log('\nPotentially unused keys in es.json:');
  for (const key of unusedInBase) {
    console.log(`  + ${key}`);
  }
}

if (hasIssues) {
  process.exit(1);
}

console.log('\nAll locale files match es.json keys.');
