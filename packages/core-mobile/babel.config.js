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
          '.ios.tsx'
        ],
        root: ['./app'],
        alias: {
          tests: './tests'
        }
      }
    ],
    'react-require',
    'inline-dotenv',
    'react-native-reanimated/plugin',
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-export-namespace-from'
  ],
  overrides: [
    {
      include: /node_modules\/(@tanstack|ethers|@avalabs\/wallets-sdk)/,
      plugins: [['@babel/plugin-transform-private-methods', { loose: true }]]
    }
  ]
}
