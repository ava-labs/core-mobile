module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.android.js',
          '.android.tsx',
          '.ios.js',
          '.ios.tsx',
        ],
        root: ['./app'],
      },
    ],
    'react-require',
    ['transform-inline-environment-variables', {
      'include': [
        'BUNDLE_ID',
        'MOONPAY_URL',
        'MOONPAY_API_KEY',
        'SNOWTRACE_TESTNET_URL',
        'SNOWTRACE_MAINNET_URL',
        'INFURA_API_KEY',
        'ETHERSCAN_API_KEY',
        'COVALENT_API_KEY',
        'POSTHOG_API_KEY',
      ]
    }]
  ],
};
