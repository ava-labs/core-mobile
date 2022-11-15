/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  resolver: {
    extraNodeModules: {
      crypto: require.resolve('react-native-quick-crypto')
    }
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true
      }
    }),
    // using metro-minify-esbuild as the minifier because:
    // 1. react native metro bundler uses uglify-es, which doesn't support bigint syntax (0n, 1n,...)
    // 2. metro-minify-esbuild is ~46x faster
    minifierPath: require.resolve('metro-minify-esbuild'),
    minifierConfig: {}
  }
}
