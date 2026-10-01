import { readFileSync } from 'node:fs';

const languages = ['es', 'eu', 'fr', 'uk'];
const catalogues = Object.fromEntries(
  languages.map((language) => [
    language,
    JSON.parse(readFileSync(new URL(`../public/assets/i18n/${language}.json`, import.meta.url), 'utf8')),
  ]),
);
const spanish = catalogues.es;
const remaining = {};

for (const language of languages) {
  remaining[language] = Object.entries(catalogues[language])
    .filter(([key, value]) => language !== 'es' && value === `${language}_${spanish[key]}`)
    .map(([key]) => key);
}

console.log(
  'Pending catalogue placeholders:',
  Object.fromEntries(Object.entries(remaining).map(([language, keys]) => [language, keys.length])),
);
if (process.argv.includes('--list')) console.log(JSON.stringify(remaining, null, 2));
if (process.argv.includes('--strict') && Object.values(remaining).some((keys) => keys.length)) process.exitCode = 1;
