module.exports = {
  assets: ['./app/assets/fonts/'],
  dependencies: {
    'react-native-passkey': {
      platforms: {
        android: null // disable Android platform, other platforms will still autolink
      }
    },
    'react-native-performance': {
      platforms: {
        ios: null,
        android: null
      }
    },
    'react-native-flipper': {
      platforms: {
        ios: null,
        android: null
      }
    }
  }
}
