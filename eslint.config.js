// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");
const eslintPluginPrettier = require("eslint-plugin-prettier");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "prettier/prettier": "error",
      "@angular-eslint/template/label-has-associated-control": "off",
      "@angular-eslint/template/click-events-have-key-events": "off",
      "@angular-eslint/template/interactive-supports-focus": "off",
      "arrow-body-style": "off",
      "prefer-arrow-callback": "off",
    },
  },
  {
    files: ["**/*.html"],
    ignores: ["src/index.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      "prettier/prettier": "error",
      "@angular-eslint/template/label-has-associated-control": "off",
      "@angular-eslint/template/click-events-have-key-events": "off",
      "@angular-eslint/template/interactive-supports-focus": "off",
    },
  },
  eslintConfigPrettier,
]);
