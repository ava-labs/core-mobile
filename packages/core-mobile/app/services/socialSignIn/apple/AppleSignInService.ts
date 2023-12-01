import appleAuth from '@invertase/react-native-apple-authentication'
import Logger from 'utils/Logger'

class AppleSigninService {
  isSupported(): boolean {
    return appleAuth.isSupported
  }

  async signIn(): Promise<string> {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL]
      })

      const { user, identityToken } = appleAuthRequestResponse

      if (!identityToken) {
        Logger.error('iOS Apple sign in error: empty token')
        throw new Error('iOS Apple sign in error: empty token')
      }

      if (user === null) {
        Logger.error('iOS Apple sign in error: user not found')
        throw new Error('iOS Apple sign in error: user not found')
      }

      const credentialState = await appleAuth.getCredentialStateForUser(user)

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        Logger.error('iOS Apple sign in error: unauthorized user')
        throw new Error('iOS Apple sign in error unauthorized user')
      }
      return identityToken
    } catch (error) {
      Logger.error('iOS Apple sign in error', error)
      throw new Error('iOS Apple sign in error')
    }
  }
}

export default new AppleSigninService()
