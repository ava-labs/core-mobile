jest.mock('@react-native-firebase/app-check', () => ({
  firebase: {
    appCheck: () => {
      return {
        getToken: () => {
          return {
            token: 'appCheckToken'
          }
        }
      }
    }
  }
}))
jest.mock('@react-native-firebase/messaging', () => () => {
  return {
    deleteToken: () => {
      return {
        token: 'fcmToken'
      }
    }
  }
})
