const path = require('path')
const { mergeConfig } = require('@react-native/metro-config')
const { getSentryExpoConfig } = require('@sentry/react-native/metro')
const merge = require('lodash.merge')

const monorepoConfig = require('./metro.monorepo.config')
const defaultConfig = getSentryExpoConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

/**
 * Force a @noble/* import to resolve to the single patched top-level copy.
 * Returns a Metro resolution result, or undefined if the subpath doesn't exist.
 */
function resolveNoblePackage(packageName, moduleName) {
  try {
    const patchedRoot = path.resolve(__dirname, 'node_modules', packageName)
    const subpath = moduleName.slice(packageName.length)
    return {
      type: 'sourceFile',
      filePath: require.resolve(patchedRoot + subpath)
    }
  } catch {
    // Subpath not found in patched copy — caller falls through to default resolver
    return undefined
  }
}

// Packages that ship a web-targeted `main` and only expose the RN entry
// through their `exports` conditions — opt them into Metro's package-exports
// resolution. (e.g. @avalabs/crypto-sdk's `main` requires @avalabs/crypto-wasm,
// which is not installed in RN; the RN entry routes to @avalabs/crypto-nitro
// via `exports`.)
const PACKAGE_EXPORTS_OPT_IN = [
  '@lombard.finance/sdk',
  '@avalabs/fusion-sdk',
  '@avalabs/crypto-sdk',
  // react-native-nitro-fetch imports 'web-streams-polyfill/polyfill', a subpath
  // only exposed via the package's "exports" map (-> dist/polyfill.js). Package
  // exports is disabled globally, so opt this package in to resolve the subpath.
  'web-streams-polyfill'
]

// Only redirect @noble/hashes subpaths that are patched for native crypto.
// Non-crypto modules (_assert, utils, crypto) must resolve normally so
// consumers expecting the v1.3.x API (e.g. ethereum-cryptography) don't break.
const PATCHED_NOBLE_HASHES = new Set([
  '@noble/hashes/hmac',
  '@noble/hashes/hmac.js',
  '@noble/hashes/pbkdf2',
  '@noble/hashes/pbkdf2.js',
  '@noble/hashes/ripemd160',
  '@noble/hashes/ripemd160.js',
  '@noble/hashes/sha2',
  '@noble/hashes/sha2.js',
  '@noble/hashes/sha256',
  '@noble/hashes/sha256.js',
  '@noble/hashes/sha512',
  '@noble/hashes/sha512.js'
])

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
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true
      }
    }),
    babelTransformerPath: require.resolve('react-native-svg-transformer')
  },
  resolver: {
    // mute warnings about circular dependencies
    requireCycleIgnorePatterns: [/^app\/.*/, /^node_modules\/.*/],
    extraNodeModules: {},
    // sbmodern is needed for storybook
    resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main'],
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg', 'cjs', 'mjs'],
    // Prevents VM modules from bundling their own copy of @avalabs/core-wallets-sdk
    // which breaks instanceof checks for provider types
    unstable_enablePackageExports: false,
    unstable_conditionNames: ['require', 'import'],
    unstable_conditionsByPlatform: {
      android: ['require', 'react-native'],
      ios: ['require', 'react-native']
    },
    resolveRequest: (context, moduleName, platform) => {
      // Handle @buoy-gg subpath exports manually since unstable_enablePackageExports is false
      const buoyMatch = moduleName.match(/^(@buoy-gg\/[^/]+)\/(.+)$/)
      if (buoyMatch) {
        const [, pkg, subpath] = buoyMatch
        return context.resolveRequest(
          context,
          `${pkg}/lib/module/${subpath}/index.js`,
          platform
        )
      }
      if (PACKAGE_EXPORTS_OPT_IN.some(pkg => moduleName.startsWith(pkg))) {
        const newContext = {
          ...context,
          unstable_enablePackageExports: true
        }
        return context.resolveRequest(newContext, moduleName, platform)
      }

      if (moduleName.startsWith('@ledgerhq/cryptoassets-evm-signatures')) {
        return context.resolveRequest(
          context,
          moduleName.replace(
            '@ledgerhq/cryptoassets-evm-signatures',
            '@ledgerhq/cryptoassets-evm-signatures/lib-es'
          ),
          platform
        )
      }
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
      if (moduleName === 'stream') {
        // when importing stream, resolve to readable-stream
        return context.resolveRequest(context, 'readable-stream', platform)
      }

      // Force patched @noble/hashes subpaths to the top-level copy.
      // Only the subpaths actually patched are redirected — non-patched
      // subpaths (e.g. _assert, utils) resolve normally so consumers
      // expecting the v1.3.x API (ethereum-cryptography) aren't broken.
      // @noble/curves needs no redirect: the global Yarn resolution
      // already forces every transitive copy onto the patched 1.9.7.
      if (PATCHED_NOBLE_HASHES.has(moduleName)) {
        const resolved = resolveNoblePackage('@noble/hashes', moduleName)
        if (resolved) return resolved
      }

      // optionally, chain to the standard Metro resolver.
      return context.resolveRequest(context, moduleName, platform)
    }
  }
}

module.exports = mergeConfig(defaultConfig, merge(baseConfig, monorepoConfig))
