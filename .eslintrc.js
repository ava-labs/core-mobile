// workaround for https://github.com/eslint/eslint/issues/3458 and https://github.com/yarnpkg/berry/issues/8
// this allows our shared eslint config to bring along its own plugins
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  extends: ["@avalabs/eslint-config-mobile"],
};
