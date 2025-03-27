const { mergeConfig } = require('@react-native/metro-config')
const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const merge = require('lodash.merge')

const monorepoConfig = require('./metro.monorepo.config')
const defaultConfig = getSentryExpoConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const baseConfig = {
  resetCache: false,
  transformer: {
    ...defaultConfig.transformer,
    unstable_allowRequireContext: true,
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  },
  resolver: {
    // mute warnings about circular dependencies
    requireCycleIgnorePatterns: [
      /^app\/.*/,
      /k2-mobile\/.*/,
      /^node_modules\/.*/
    ],
    extraNodeModules: {
      stream: require.resolve('./node_modules/stream-browserify')
    },
    // sbmodern is needed for storybook
    resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
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
      if (moduleName === 'crypto') {
        // when importing crypto, resolve to react-native-quick-crypto
        return context.resolveRequest(
          context,
          'react-native-quick-crypto',
          platform
        )
      }
      if (moduleName === 'buffer') {
        // when importing buffer, resolve to @craftzdog/react-native-buffer
        return context.resolveRequest(
          context,
          '@craftzdog/react-native-buffer',
          platform
        )
      }
      // optionally, chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform)
    }
  }
}

module.exports = mergeConfig(defaultConfig, merge(baseConfig, monorepoConfig))
