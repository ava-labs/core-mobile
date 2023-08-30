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
    'react-native-reanimated/plugin'
  ],
  overrides: [
    {
      include: /node_modules\/(@tanstack|ethers)/,
      plugins: [['@babel/plugin-transform-private-methods', { loose: true }]]
    }
  ]
}
