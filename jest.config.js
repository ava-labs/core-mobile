module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  moduleNameMapper: {
    uuid: require.resolve('uuid')
  },
  testPathIgnorePatterns: [
    './e2e/tests/bridge',
  ],
}
