/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  resolver: {
    // sbmodern is needed for storybook
    resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
    extraNodeModules: {
      crypto: require.resolve('react-native-quick-crypto')
    },
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('@ledgerhq/cryptoassets')) {
        return context.resolveRequest(
          context,
          moduleName.replace(
            '@ledgerhq/cryptoassets',
            '@ledgerhq/cryptoassets/lib-es'
          ),
          platform
        )
      }
      // Optionally, chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform)
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
