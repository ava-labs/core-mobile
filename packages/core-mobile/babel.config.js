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
    // NOTE: `inline-dotenv` is intentionally NOT used. Its AST inlining hides
    // functions from react-native-worklets' worklet pass, breaking
    // workletization ("Tried to synchronously call a Remote Function
    // `addListener`" — react-native-worklets #565). Env values are read via
    // react-native-config (`Config.*`) instead of `process.env.*`.
    '@babel/plugin-transform-class-static-block',
    '@babel/plugin-transform-export-namespace-from'
    // NOTE: the previous `overrides` block forcing
    // `@babel/plugin-transform-private-methods` (loose) onto @tanstack / ethers
    // / @avalabs/wallets-sdk was removed. RN 0.85's Hermes supports class
    // private methods/fields natively, so transforming those node_modules is no
    // longer required.
    // NOTE: `react-native-worklets/plugin` is intentionally NOT listed here.
    // babel-preset-expo (SDK 54+) auto-adds it when react-native-worklets is
    // installed. Listing it manually applies the worklet transform twice, which
    // breaks worklet identity ("Tried to synchronously call a non-worklet
    // function on the UI thread").
  ]
}
