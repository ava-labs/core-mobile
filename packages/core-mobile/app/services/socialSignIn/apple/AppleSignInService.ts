import appleAuth from '@invertase/react-native-apple-authentication'
import Logger from 'utils/Logger'

class AppleSigninService {
  isSupported(): boolean {
    return appleAuth.isSupported
  }

  async signin(): Promise<string> {
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL]
      })

      const { user, identityToken } = appleAuthRequestResponse

      if (!identityToken) {
        Logger.error('Seedless login error: empty token')
        throw new Error('Seedless login error: empty token')
      }

      if (user === null) {
        Logger.error('Seedless login error: user not found')
        throw new Error('Seedless login error: user not found')
      }

      const credentialState = await appleAuth.getCredentialStateForUser(user)

      if (credentialState !== appleAuth.State.AUTHORIZED) {
        Logger.error('Seedless login error: unauthorized user')
        throw new Error('Seedless login error: unauthorized user')
      }
      return identityToken
    } catch (error) {
      Logger.error('Seedless login error', error)
      throw new Error('Seedless login error')
    }
  }
}

export default new AppleSigninService()
