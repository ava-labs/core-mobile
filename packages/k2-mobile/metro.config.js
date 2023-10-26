/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true
      }
    })
  },
  resolver: {
    // sbmodern is needed for storybook
    resolverMainFields: ['sbmodern', 'react-native', 'browser', 'main']
  }
}
