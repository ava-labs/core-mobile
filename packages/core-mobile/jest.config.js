module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native'
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/tests/playwright/'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/msw/jestSetup.js',
    '<rootDir>/tests/firebase/jestSetup.js',
    './node_modules/@react-native-google-signin/google-signin/jest/build/jest/setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!' +
      [
        '@expo',
        'dripsy',
        'node-fetch',
        'fetch-blob',
        '@react-native',
        'react-native',
        'data-uri-to-buffer',
        'formdata-polyfill',
        '@notifee/react-native',
        '@invertase/react-native-apple-authentication',
        '@avalabs/vm-module-types',
        'camelcase-keys',
        'map-obj',
        'camelcase',
        'quick-lru',
        'react-redux'
      ].join('|') +
      ')'
  ]
}
