module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!' + ['@(?!(?:@hpke)/)'].join('|') + ')'
  ]
}
