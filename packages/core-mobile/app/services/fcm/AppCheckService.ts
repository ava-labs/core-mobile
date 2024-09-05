import {
  firebase,
  FirebaseAppCheckTypes
} from '@react-native-firebase/app-check'
import Logger from 'utils/Logger'

class AppCheckService {
  init = (): void => {
    const rnfbProvider = firebase
      .appCheck()
      .newReactNativeFirebaseAppCheckProvider()
    rnfbProvider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
        debugToken:
          'some token you have configured for your project firebase web console'
      },
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
        debugToken: process.env.APPCHECK_DEBUG_TOKEN_APPLE
      }
    })

    firebase
      .appCheck()
      .initializeAppCheck({
        provider: rnfbProvider,
        isTokenAutoRefreshEnabled: true
      })
      .catch(reason => {
        Logger.error(`initializeAppCheck failed: ${reason}`)
      })
  }

  verifyAppCheck = async (): Promise<void> => {
    try {
      const { token } = await firebase.appCheck().getToken(true)

      if (token.length > 0) {
        Logger.info('AppCheckService:verifyAppCheck passed')
      }
    } catch (error) {
      Logger.error(`[AppCheckService.ts][verifyAppCheck]${error}`)
    }
  }

  getToken = async (): Promise<FirebaseAppCheckTypes.AppCheckTokenResult> => {
    return await firebase.appCheck().getToken(true)
  }
}
export default new AppCheckService()
