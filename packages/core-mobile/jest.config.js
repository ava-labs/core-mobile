const coverageThreshold = require('./coverage-thresholds.json')

module.exports = {
  preset: '@react-native/jest-preset',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json-summary', 'lcov', 'html', 'text-summary'],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/*.test.{ts,tsx}',
    '!app/**/*.stories.{ts,tsx}',
    '!app/**/__mocks__/**'
  ],
  coverageThreshold: {
    global: coverageThreshold
  },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
    'react-native-safe-area-context':
      '<rootDir>/node_modules/react-native-safe-area-context',
    'react-native-svg': '<rootDir>/node_modules/react-native-svg',
    '^@solana/(.+)$': '<rootDir>/node_modules/@solana/$1/dist/index.node.cjs',
    '^react-native-reanimated$':
      '<rootDir>/node_modules/react-native-reanimated/mock.js',
    '^react-native-worklets$':
      '<rootDir>/node_modules/react-native-worklets/src/mock.ts',
    '^react-native-permissions$':
      '<rootDir>/node_modules/react-native-permissions/mock.js'
  },
  testPathIgnorePatterns: ['<rootDir>/e2e-appium/', '<rootDir>/scripts/'],
  setupFilesAfterEnv: [
    '<rootDir>/tests/jestSetup/posthog.js',
    '<rootDir>/tests/msw/jestSetup.js',
    '<rootDir>/tests/jestSetup/firebase.js',
    '<rootDir>/tests/jestSetup/toast.js',
    '<rootDir>/tests/jestSetup/crypto.js',
    '<rootDir>/tests/jestSetup/cryptoSdk.js',
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
        'd3',
        'd3-.*',
        'internmap',
        'delaunator',
        'robust-predicates',
        'data-uri-to-buffer',
        'formdata-polyfill',
        '@notifee/react-native',
        '@invertase/react-native-apple-authentication',
        '@avalabs/vm-module-types',
        '@avalabs/evm-module',
        '@avalabs/bitcoin-module',
        '@avalabs/avalanche-module',
        '@avalabs/svm-module',
        '@avalabs/crypto-sdk',
        '@avalabs/crypto-nitro',
        '@avalabs/fusion-sdk',
        'camelcase-keys',
        'map-obj',
        'camelcase',
        'quick-lru',
        'react-redux',
        'uuid',
        '@ledgerhq',
        '@avalabs/hw-app-avalanche',
        '@keystonehq'
      ].join('|') +
      ')'
  ]
}
