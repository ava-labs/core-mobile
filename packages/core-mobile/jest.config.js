module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  clearMocks: true,
  moduleNameMapper: {
    '^react-native$': '<rootDir>/node_modules/react-native',
    'react-native-safe-area-context':
      '<rootDir>/node_modules/react-native-safe-area-context',
    'react-native-svg': '<rootDir>/node_modules/react-native-svg',
    '^@solana/(.+)$': '<rootDir>/node_modules/@solana/$1/dist/index.node.cjs',
    '^react-native-reanimated$':
      '<rootDir>/node_modules/react-native-reanimated/mock.js',
    '^react-native-worklets$':
      '<rootDir>/node_modules/react-native-worklets/src/mock.ts'
  },
  testPathIgnorePatterns: [
    '<rootDir>/e2e/tests/playwright/',
    '<rootDir>/e2e-appium/'
  ],
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
