import {
  firebase,
  FirebaseAppCheckTypes
} from '@react-native-firebase/app-check'
import Logger from 'utils/Logger'
import Config from 'react-native-config'

class AppCheckService {
  init = (): void => {
    const rnfbProvider = firebase
      .appCheck()
      .newReactNativeFirebaseAppCheckProvider()
    rnfbProvider.configure({
      android: {
        provider: __DEV__ ? 'debug' : 'playIntegrity',
        debugToken: Config.APPCHECK_DEBUG_TOKEN_APPLE
      },
      apple: {
        provider: __DEV__ ? 'debug' : 'appAttestWithDeviceCheckFallback',
        debugToken: Config.APPCHECK_DEBUG_TOKEN_APPLE
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

  /**
   * For debug purpose, to check if setup is correct
   */
  verifyAppCheck = async (): Promise<void> => {
    try {
      const { token } = await this.getToken()

      if (token.length > 0) {
        Logger.info('AppCheckService:verifyAppCheck passed')
      }
    } catch (error) {
      Logger.error(`[AppCheckService.ts][verifyAppCheck]${error}`)
    }
  }

  getToken = async (): Promise<FirebaseAppCheckTypes.AppCheckTokenResult> => {
    return await firebase.appCheck().getToken(false)
  }

  fetch = async (url: string, bodyJson: string): Promise<Response> => {
    const appCheckToken = await this.getToken()
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': appCheckToken.token
      },
      body: bodyJson
    }

    return fetch(url, options)
  }
}
export default new AppCheckService()
