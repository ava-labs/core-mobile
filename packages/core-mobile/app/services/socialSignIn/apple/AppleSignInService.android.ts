import { appleAuthAndroid } from '@invertase/react-native-apple-authentication'
import Config from 'react-native-config'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import Logger from 'utils/Logger'
import { OidcPayload } from 'seedless/types'
import { AppleSigninServiceInterface } from './types'

if (!Config.APPLE_OAUTH_CLIENT_ID) {
  Logger.warn('APPLE_OAUTH_CLIENT_ID is missing. Please check your env file.')
}

if (!Config.APPLE_OAUTH_REDIRECT_URL) {
  Logger.warn(
    'APPLE_OAUTH_REDIRECT_URL is missing. Please check your env file.'
  )
}

const clientId = Config.APPLE_OAUTH_CLIENT_ID
const redirectUri = Config.APPLE_OAUTH_REDIRECT_URL

if (clientId && redirectUri) {
  appleAuthAndroid.configure({
    clientId,
    redirectUri,
    scope: appleAuthAndroid.Scope.EMAIL,
    responseType: appleAuthAndroid.ResponseType.ALL,
    state: DeviceInfoService.getAppNameSpace()
  })
}

class AppleSigninService implements AppleSigninServiceInterface {
  isSupported(): boolean {
    return appleAuthAndroid.isSupported
  }

  async signIn(): Promise<OidcPayload> {
    try {
      const response = await appleAuthAndroid.signIn()

      if (response.id_token === undefined) {
        Logger.error('Android Apple sign in error: empty token')
        throw new Error('Android Apple sign in error: empty token')
      }

      return { oidcToken: response.id_token }
    } catch (error) {
      Logger.error('Android Apple sign in error', error)
      throw new Error('Android Apple sign in error')
    }
  }
}

export default new AppleSigninService()
