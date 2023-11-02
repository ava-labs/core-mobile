import { GoogleSignin } from '@react-native-google-signin/google-signin'
import Config from 'react-native-config'

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

async function signInWithGoogle(): Promise<string> {
  try {
    const userInfo = await GoogleSignin.signIn()

    if (userInfo.idToken) {
      return userInfo.idToken
    } else {
      throw new Error('Seedless login error')
    }
  } catch (error) {
    throw new Error('Seedless login error')
  }
}

export { signInWithGoogle }
