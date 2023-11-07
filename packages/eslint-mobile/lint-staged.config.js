const { ESLint } = require("eslint");
const eslint = new ESLint();

const {
  generateLintStagedConfig,
} = require("../../scripts/generate-lint-staged-config.js");

module.exports = generateLintStagedConfig(eslint);
