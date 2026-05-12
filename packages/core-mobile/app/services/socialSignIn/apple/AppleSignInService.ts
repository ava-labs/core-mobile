import appleAuth from '@invertase/react-native-apple-authentication'
import { OidcPayload } from 'seedless/types'
import Logger from 'utils/Logger'
import { formatSignInErrorReason } from '../formatSignInErrorReason'
import { AppleSigninServiceInterface } from './types'

class AppleSigninService implements AppleSigninServiceInterface {
  isSupported(): boolean {
    return appleAuth.isSupported
  }

  async signIn(): Promise<OidcPayload> {
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
        throw new Error('iOS Apple sign in error: unauthorized user')
      }

      return { oidcToken: identityToken }
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as Error & { code: string }).code === appleAuth.Error.CANCELED
      ) {
        throw new Error('USER_CANCELED')
      }
      if (
        error instanceof Error &&
        error.message.startsWith('iOS Apple sign in error')
      ) {
        throw error
      }
      const reason = formatSignInErrorReason(error)
      Logger.error(`iOS Apple sign in error: ${reason}`, error)
      throw new Error(`iOS Apple sign in error: ${reason}`)
    }
  }
}

export default new AppleSigninService()
