import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import postcss from 'postcss';

const failures = [];
const files = [];
const tokenFile = path.resolve('src/styles/tokens.css');
const declared = new Set();
const used = new Set();
const color = /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch)\(|\b(?:white|black|red|blue|green|gray|grey|orange|yellow|navy|teal)\b/i;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.(?:css|html|ts)$/.test(file) && !file.endsWith('.spec.ts')) files.push(file);
  }
}

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function checkTemplate(file, template) {
  if (/\bstyle\s*=\s*['"]|\[style(?:\.|\])|\[ngStyle\]|<style\b/.test(template)) {
    fail(file, 'Styles in templates must use classes or appRuntimeStyle.');
  }
  if (/\b(?:fill|stroke|color|bgcolor)\s*=\s*['"](?:#[\da-f]{3,8}\b|rgba?\(|white\b|black\b|red\b|blue\b)/i.test(template)) {
    fail(file, 'Static presentation colors must use currentColor or a CSS token.');
  }
}

walk('src');
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  if (file.endsWith('.css')) {
    const ast = postcss.parse(source, { from: file });
    ast.walkRules((rule) => {
      if (rule.selector.includes('::ng-deep')) fail(file, 'Cross-component ng-deep styling is forbidden.');
    });
    ast.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) declared.add(decl.prop);
      for (const match of decl.value.matchAll(/var\((--[\w-]+)\s*\)/g)) used.add(match[1]);
      if (path.resolve(file) !== tokenFile && color.test(decl.value.replace(/--[\w-]+/g, ''))) {
        fail(file, `Design color must come from tokens: ${decl.prop}.`);
      }
    });
  } else if (file.endsWith('.html')) {
    checkTemplate(file, source);
  } else {
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (
        ts.isCallExpression(node) &&
        ['Component', 'Directive'].includes(node.expression.getText(ast)) &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        for (const property of node.arguments[0].properties) {
          const name = property.name?.getText(ast);
          if (name === 'styles') fail(file, 'Component CSS must be in an external stylesheet.');
          if (name === 'template' && ts.isStringLiteralLike(property.initializer)) checkTemplate(file, property.initializer.text);
          if (name === 'host' && /\bstyle\b/.test(property.initializer.getText(ast))) fail(file, 'Inline host styles are forbidden.');
        }
      }
      if (ts.isStringLiteralLike(node) && /^(?:#[\da-f]{3,8}|(?=[\da-f]*[a-f])[\da-f]{6})$/i.test(node.text)) {
        fail(file, 'Static design colors in TypeScript must resolve a CSS token.');
      }
      if (ts.isBinaryExpression(node) && /\.style(?:\.|\[)/.test(node.left.getText(ast))) {
        fail(file, 'Element style writes must use a class or RuntimeStyleRegistry.');
      }
      if (
        ts.isCallExpression(node) &&
        /\.style\.(?:setProperty|removeProperty)$/.test(node.expression.getText(ast)) &&
        !file.endsWith('runtime-style-registry.service.ts')
      ) {
        fail(file, 'Direct style mutation must use RuntimeStyleRegistry.');
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    for (const match of source.matchAll(/['"](--[\w-]+)['"]\s*:/g)) declared.add(match[1]);
  }
}

for (const name of used) if (!declared.has(name)) fail('CSS', `Undefined custom property: ${name}`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Styles checked: ${files.length} files; no inline CSS, raw design colors, ng-deep or undefined custom properties.`);
}
