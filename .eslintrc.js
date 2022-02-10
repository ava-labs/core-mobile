module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    '@react-native-community',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['node_modules', '/*.js', 'dist'],
  plugins: [
      'react',
      'react-native',
      'react-hooks',
      'prettier',
      'eslint-comments',
      '@typescript-eslint',
  ],
  "rules": {
    "react-hooks/exhaustive-deps": "off",
    "react-native/no-inline-styles": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "off"
  }
};
