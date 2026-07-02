const coverageThreshold = require('./coverage-thresholds.json')

module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json-summary', 'lcov', 'html', 'text-summary'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/fixtures/**',
    '!src/assets/**'
  ],
  coverageThreshold: {
    global: coverageThreshold
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native'
  },
  transformIgnorePatterns: [
    'node_modules/(?!' +
      ['@react-native', 'react-native', '@avalabs/core-utils-sdk'].join('|') +
      ')'
  ]
}
