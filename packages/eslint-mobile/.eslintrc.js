const configs = require("./src/configs");

module.exports = {
  root: true,
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  ...configs.recommended,
};
