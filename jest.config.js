module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid')
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/tests/playwright/'],
  setupFilesAfterEnv: ['<rootDir>/tests/msw/jestSetup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!' +
      [
        'node-fetch',
        'fetch-blob',
        '@react-native',
        'react-native',
        'data-uri-to-buffer',
        'formdata-polyfill'
      ].join('|') +
      ')'
  ]
}
