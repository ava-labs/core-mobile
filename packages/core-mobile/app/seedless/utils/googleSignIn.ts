import { authorize } from 'react-native-app-auth'
import Config from 'react-native-config'

if (!Config.GOOGLE_OAUTH_CLIENT_ID) {
  throw Error('GOOGLE_OAUTH_CLIENT_ID is missing. Please check your env file.')
}

const config = {
  issuer: 'https://accounts.google.com',
  clientId: Config.GOOGLE_OAUTH_CLIENT_ID,
  redirectUrl: 'org.avalabs.avaxwallet.internal://auth',
  scopes: ['openid']
}

async function signInWithGoogle(): Promise<void> {
  const authState = await authorize(config)

  // eslint-disable-next-line no-console
  console.log(authState)
}

export { signInWithGoogle }
