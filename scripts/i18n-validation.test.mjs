import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'urbanoa-i18n-validation-'));
const script = path.resolve('scripts/i18n-excel.mjs');
try {
  await fs.mkdir(path.join(root, 'src'));
  await fs.mkdir(path.join(root, 'langs'));
  const config = path.join(root, 'config.json');
  await fs.writeFile(
    config,
    JSON.stringify({
      sourceDir: path.join(root, 'src'),
      cataloguesDir: path.join(root, 'langs'),
      catalogueStructure: 'flat',
      referenceLanguage: 'es',
      requiredLanguages: ['es', 'en'],
      auditOutput: path.join(root, 'audit.json'),
      literalsOutput: path.join(root, 'literals.md'),
    }),
  );
  const run = (command) => spawnSync(process.execPath, [script, command, '--config', config, '--allow-unused'], { encoding: 'utf8' });
  const writeLocales = async (value) => {
    for (const lang of ['es', 'en']) await fs.writeFile(path.join(root, 'langs', `${lang}.json`), JSON.stringify(value));
  };
  await writeLocales({ 'ops.title': 'Title' });
  await fs.writeFile(path.join(root, 'src', 'fixture.ts'), "const template = `<span>{{ 'ops.fineDetail.historic' | translate }}</span>`;");
  const missing = run('audit');
  assert.notEqual(missing.status, 0, 'audit must fail when every locale lacks a used key');
  assert.match(missing.stderr, /ops\.fineDetail\.historic/);

  await fs.writeFile(
    path.join(root, 'src', 'fixture.ts'),
    [
      'const template = `<a href="https://example.com">{{ \'ops.title\' | translate }}</a>',
      "<span>{{ 'ops.status.' + status | translate }}</span>`;",
      "// translate('ops.commentOnly')",
    ].join('\n'),
  );
  await writeLocales({ 'ops.title': 'Title', 'ops.status.2': 'Expired', 'ops.status.3': 'Unavailable', 'ops.commentOnly': 'Unused' });
  const pruned = run('prune');
  assert.equal(pruned.status, 0, pruned.stderr);
  const result = JSON.parse(await fs.readFile(path.join(root, 'langs', 'es.json'), 'utf8'));
  assert.equal(result['ops.title'], 'Title', 'URLs in inline templates must not hide translation keys');
  assert.equal(result['ops.status.2'], 'Expired', 'dynamic template keys must survive pruning');
  assert.equal(result['ops.status.3'], 'Unavailable');
  assert.equal(result['ops.commentOnly'], undefined);
  console.log('Translation validation regression tests passed.');
} finally {
  await fs.rm(root, { recursive: true, force: true });
}
