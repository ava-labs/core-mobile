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
          tests: './tests',
          features: './app/new/features',
          common: './app/new/common'
        }
      }
    ],
    // NOTE: React Compiler is enabled via babel-preset-expo (app.json
    // `experiments.reactCompiler`), NOT listed here. The standalone
    // `babel-plugin-react-compiler` has no scoping and would compile
    // node_modules too — including react-native-reanimated's source (loaded
    // via its `react-native` field), which breaks reanimated's Mutable/worklet
    // internals ("Tried to synchronously call a non-worklet function
    // `addListener` on the UI thread"). The preset excludes node_modules.
    // TEMP TEST: `inline-dotenv` removed to check if its AST inlining breaks
    // reanimated/worklets workletization (react-native-worklets #565 class
    // bug: dotenv babel plugins hide functions from the worklet pass, causing
    // "Tried to synchronously call a Remote Function `addListener`"). If this
    // resolves the crash, migrate the few `process.env.*` reads to
    // react-native-config (Config.*) and keep this removed.
    // 'inline-dotenv',
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-export-namespace-from'
    // NOTE: `react-native-worklets/plugin` is intentionally NOT listed here.
    // babel-preset-expo (SDK 54+) auto-adds it when react-native-worklets is
    // installed. Listing it manually applies the worklet transform twice, which
    // breaks worklet identity ("Tried to synchronously call a non-worklet
    // function on the UI thread").
  ]
}
