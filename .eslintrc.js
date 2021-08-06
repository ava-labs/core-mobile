module.exports = {
  root: true,
  extends: '@react-native-community',
  ignorePatterns: ['node_modules', '/*.js'],
  plugins: [
      'react',
      'react-native',
      'react-hooks',
      'prettier',
      'eslint-comments',
      '@typescript-eslint',
  ]
};
