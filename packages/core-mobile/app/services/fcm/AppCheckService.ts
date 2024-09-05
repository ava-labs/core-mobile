import {
  firebase,
  FirebaseAppCheckTypes
} from '@react-native-firebase/app-check'
import Logger from 'utils/Logger'

class AppCheckService {
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
