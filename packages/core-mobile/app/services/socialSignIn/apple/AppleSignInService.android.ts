import { appleAuthAndroid } from '@invertase/react-native-apple-authentication'
import Config from 'react-native-config'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import Logger from 'utils/Logger'

if (!Config.APPLE_OAUTH_CLIENT_ID) {
  throw Error('APPLE_OAUTH_CLIENT_ID is missing. Please check your env file.')
}

if (!Config.APPLE_OAUTH_REDIRECT_URL) {
  throw Error(
    'APPLE_OAUTH_REDIRECT_URL is missing. Please check your env file.'
  )
}

const clientId = Config.APPLE_OAUTH_CLIENT_ID
const redirectUri = Config.APPLE_OAUTH_REDIRECT_URL

class AppleSigninService {
  isSupported(): boolean {
    return appleAuthAndroid.isSupported
  }

  configure(): void {
    appleAuthAndroid.configure({
      clientId,
      redirectUri,
      scope: appleAuthAndroid.Scope.EMAIL,
      responseType: appleAuthAndroid.ResponseType.ALL,
      state: DeviceInfoService.getAppNameSpace()
    })
  }

  async signin(): Promise<string> {
    try {
      this.configure()
      const response = await appleAuthAndroid.signIn()
      if (response.id_token === undefined) {
        Logger.error('Seedless login error: empty token')
        throw new Error('Seedless login error: empty token')
      }
      return response.id_token
    } catch (error) {
      Logger.error('Seedless login error', error)
      throw new Error('Seedless login error')
    }
  }
}

export default new AppleSigninService()
