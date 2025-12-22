import {
  firebase,
  FirebaseAppCheckTypes
} from '@react-native-firebase/app-check'
import Logger from 'utils/Logger'
import Config from 'react-native-config'
import { isDebugOrInternalBuild } from 'utils/Utils'

class AppCheckService {
  init = (): void => {
    const shouldUseDebugProvider =
      isDebugOrInternalBuild() || process.env.E2E === 'true'

    const rnfbProvider = firebase
      .appCheck()
      .newReactNativeFirebaseAppCheckProvider()
    rnfbProvider.configure({
      android: {
        provider: shouldUseDebugProvider ? 'debug' : 'playIntegrity',
        debugToken: Config.APPCHECK_DEBUG_TOKEN
      },
      apple: {
        provider: shouldUseDebugProvider ? 'debug' : 'appAttest',
        debugToken: Config.APPCHECK_DEBUG_TOKEN
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
}

export default new AppCheckService()
