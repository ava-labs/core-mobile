import { appleAuthAndroid } from '@invertase/react-native-apple-authentication'
import Config from 'react-native-config'
import { v4 as uuidv4 } from 'uuid'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import Logger from 'utils/Logger'
import { OidcPayload } from 'seedless/types'
import { AppleSigninServiceInterface } from './types'

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

appleAuthAndroid.configure({
  clientId,
  redirectUri,
  scope: appleAuthAndroid.Scope.EMAIL,
  responseType: appleAuthAndroid.ResponseType.ALL,
  state: DeviceInfoService.getAppNameSpace()
})

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

      // apple sign in only returns user info the first time user signs up
      // thus, there is no need to persist user id for the refresh token flow as we can't depend on it
      // here, we are saving a random user id
      // this means we will force user to do a full recover flow once their tokens expire
      return { oidcToken: response.id_token, userId: uuidv4() }
    } catch (error) {
      Logger.error('Android Apple sign in error', error)
      throw new Error('Android Apple sign in error')
    }
  }
}

export default new AppleSigninService()
