const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { createSentryMetroSerializer } = require('@sentry/react-native/metro')
const merge = require('lodash.merge')

const monorepoConfig = require('./metro.monorepo.config')
const defaultConfig = getDefaultConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const baseConfig = {
  resetCache: false,
  serializer: {
    customSerializer: createSentryMetroSerializer()
  },
  transformer: {
    ...defaultConfig.transformer,
    unstable_allowRequireContext: true,
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  },
  resolver: {
    extraNodeModules: {
      // react-native-quick-crypto integration
      crypto: require.resolve('react-native-quick-crypto'),
      stream: require.resolve('./node_modules/stream-browserify'),
      buffer: require.resolve('./node_modules/@craftzdog/react-native-buffer')
    },
    // sbmodern is needed for storybook
    resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
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
    }
  }
}

module.exports = mergeConfig(defaultConfig, merge(baseConfig, monorepoConfig))
