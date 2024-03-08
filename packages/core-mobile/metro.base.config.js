const { getDefaultConfig } = require('metro-config')
const { createSentryMetroSerializer } = require('@sentry/react-native/metro')

const getBaseConfig = async () => {
  const {
    resolver: { sourceExts, assetExts }
  } = await getDefaultConfig()

  return {
    serializer: {
      customSerializer: createSentryMetroSerializer()
    },
    resolver: {
      extraNodeModules: {
        // this is for any modules that use require('crypto')
        crypto: require.resolve('react-native-quick-crypto')
      },
      // sbmodern is needed for storybook
      resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
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
        if (moduleName.startsWith('@ledgerhq/domain-service')) {
          return context.resolveRequest(
            context,
            moduleName.replace(
              '@ledgerhq/domain-service',
              '@ledgerhq/domain-service/lib-es'
            ),
            platform
          )
        }
        if (moduleName.startsWith('@ledgerhq/evm-tools')) {
          return context.resolveRequest(
            context,
            moduleName.replace(
              '@ledgerhq/evm-tools',
              '@ledgerhq/evm-tools/lib-es'
            ),
            platform
          )
        }
        if (moduleName.startsWith('@ledgerhq/live-network')) {
          return context.resolveRequest(
            context,
            moduleName.replace(
              '@ledgerhq/live-network',
              '@ledgerhq/live-network/lib-es'
            ),
            platform
          )
        }
        // optionally, chain to the standard Metro resolver.
        return context.resolveRequest(context, moduleName, platform)
      },
      assetExts: assetExts.filter(ext => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg']
    },
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true
        }
      }),

      /**
       * using metro-minify-esbuild as the minifier because:
       * 1. react native metro bundler uses uglify-es, which doesn't support bigint syntax (0n, 1n,...)
       * 2. metro-minify-esbuild is ~46x faster
       */
      minifierPath: require.resolve('metro-minify-terser'),
      minifierConfig: {},
      babelTransformerPath: require.resolve('react-native-svg-transformer')
    }
  }
}

module.exports = { getBaseConfig }
