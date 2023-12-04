import { GoogleSignin } from '@react-native-google-signin/google-signin'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { OidcPayload } from 'seedless/types'

if (!Config.GOOGLE_OAUTH_CLIENT_WEB_ID) {
  throw Error(
    'GOOGLE_OAUTH_CLIENT_WEB_ID is missing. Please check your env file.'
  )
}

if (!Config.GOOGLE_OAUTH_CLIENT_IOS_ID) {
  throw Error(
    'GOOGLE_OAUTH_CLIENT_IOS_ID is missing. Please check your env file.'
  )
}

GoogleSignin.configure({
  webClientId: Config.GOOGLE_OAUTH_CLIENT_WEB_ID,
  iosClientId: Config.GOOGLE_OAUTH_CLIENT_IOS_ID
})

/**
 * Service for Google Signin
 * https://github.com/react-native-google-signin/google-signin
 */
class GoogleSigninService {
  async signin(): Promise<OidcPayload> {
    try {
      const userInfo = await GoogleSignin.signIn()

      if (userInfo.idToken) {
        return { oidcToken: userInfo.idToken, userId: userInfo.user.id }
      } else {
        const error = 'Google sign in error: empty token'
        Logger.error(error)
        throw new Error(error)
      }
    } catch (error) {
      Logger.error('Google sign in error', error)
      throw new Error('Google sign in error')
    }
  }
}

export default new GoogleSigninService()
