module.exports = {
  presets: ['babel-preset-expo'],
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
          '.ios.tsx'
        ],
        root: ['./app'],
        alias: {
          tests: './tests'
        }
      }
    ],
    'inline-dotenv',
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-export-namespace-from',
    'react-native-reanimated/plugin'
  ],
  overrides: [
    {
      include: /node_modules\/(@tanstack|ethers|@avalabs\/wallets-sdk)/,
      plugins: [['@babel/plugin-transform-private-methods', { loose: true }]]
    }
  ]
}
