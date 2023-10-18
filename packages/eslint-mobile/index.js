module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "@react-native-community",
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:prettier/recommended",
    "plugin:@tanstack/eslint-plugin-query/recommended",
    "plugin:sonarjs/recommended",
  ],
  ignorePatterns: ["node_modules"],
  plugins: [
    "react",
    "react-native",
    "react-hooks",
    "prettier",
    "eslint-comments",
    "@typescript-eslint",
    "import",
    "detox",
    "promise",
    "sonarjs",
  ],
  rules: {
    "no-console": 2,
    radix: "off", // parseInt should not have radix when parsing a value that can be number or hex
    "react-hooks/exhaustive-deps": 1,
    "react-native/no-inline-styles": "off",
    "promise/catch-or-return": ["error", { allowFinally: true }],
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      { allowExpressions: true },
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": 1,
    "@typescript-eslint/ban-ts-comment": "off",
    eqeqeq: 2,
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-explicit-any": 1,
    "@typescript-eslint/no-unused-vars": [
      2,
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
    "import/order": [
      2,
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
      },
    ],
    "sonarjs/no-duplicate-string": 0,
  },
  overrides: [
    {
      files: ["*.ts", "*.js"],
      env: {
        "detox/detox": true,
        jest: true,
        "jest/globals": true,
      },
    },
  ],
};
