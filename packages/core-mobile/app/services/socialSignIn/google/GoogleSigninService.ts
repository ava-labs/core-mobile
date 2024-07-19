import { GoogleSignin } from '@react-native-google-signin/google-signin'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { OidcPayload } from 'seedless/types'

if (!Config.GOOGLE_OAUTH_CLIENT_WEB_ID) {
  Logger.warn(
    'GOOGLE_OAUTH_CLIENT_WEB_ID is missing in env file. GoogleSignInService is disabled.'
  )
}

if (!Config.GOOGLE_OAUTH_CLIENT_IOS_ID) {
  Logger.warn(
    'GOOGLE_OAUTH_CLIENT_IOS_ID is missing in env file. GoogleSignInService is disabled.'
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
        return { oidcToken: userInfo.idToken }
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

  async signOut(): Promise<null> {
    return GoogleSignin.signOut()
  }
}

export default new GoogleSigninService()
