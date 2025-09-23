// prettier.config.js, .prettierrc.js, prettier.config.mjs, or .prettierrc.mjs

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  trailingComma: 'es5',
  bracketSpacing: true,
  quoteProps: 'as-needed',
  singleQuote: true,
  semi: false,
  proseWrap: 'never',
  printWidth: 120,
  useTabs: false,
  tabWidth: 2,
  endOfLine: 'auto',
}

module.export = config
