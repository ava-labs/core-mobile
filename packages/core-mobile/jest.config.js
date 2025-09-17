module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
    '^@solana/(.+)$': '<rootDir>/node_modules/@solana/$1/dist/index.node.cjs'
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/tests/playwright/'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/msw/jestSetup.js',
    '<rootDir>/tests/jestSetup/firebase.js',
    '<rootDir>/tests/jestSetup/toast.js',
    '<rootDir>/tests/jestSetup/crypto.js',
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
        'react-redux',
        'uuid',
        '@ledgerhq',
        '@avalabs/hw-app-avalanche'
      ].join('|') +
      ')'
  ]
}
