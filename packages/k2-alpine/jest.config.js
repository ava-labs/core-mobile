module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native'
  },
  transformIgnorePatterns: [
    'node_modules/(?!' +
      ['@react-native', 'react-native', '@avalabs/core-utils-sdk'].join('|') +
      ')'
  ]
}
