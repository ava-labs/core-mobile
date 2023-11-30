import Config from 'react-native-config'
import { Passkey } from 'react-native-passkey'
import {
  PasskeyAuthenticationRequest,
  PasskeyAuthenticationResult,
  PasskeyRegistrationRequest,
  PasskeyRegistrationResult
} from 'react-native-passkey/lib/typescript/Passkey'
import {
  FIDOAuthenticationResult,
  FIDOAuthenticationRequest,
  FIDORegistrationResult,
  FIDORegistrationRequest
} from 'services/passkey/types'

if (!Config.SEEDLESS_ENVIRONMENT) {
  throw Error('SEEDLESS_ENVIRONMENT is missing. Please check your env file.')
}

class PasskeyService {
  get isSupported(): boolean {
    return Passkey.isSupported()
  }

  get rpID(): string {
    return Config.SEEDLESS_ENVIRONMENT === 'prod' ? 'core.app' : 'test.core.app'
  }

  async register(
    challengeOptions: FIDORegistrationRequest,
    withSecurityKey: boolean
  ): Promise<FIDORegistrationResult> {
    const request = this.prepareRegistrationRequest(challengeOptions)

    const result = await Passkey.register(request, { withSecurityKey })

    return this.convertRegistrationResult(result)
  }

  async authenticate(
    challengeOptions: FIDOAuthenticationRequest,
    withSecurityKey: boolean
  ): Promise<FIDOAuthenticationResult> {
    const request = this.prepareAuthenticationRequest(challengeOptions)

    const result = await Passkey.authenticate(request, {
      withSecurityKey
    })

    return this.convertAuthenticationResult(result)
  }

  private prepareRegistrationRequest(
    request: FIDORegistrationRequest
  ): PasskeyRegistrationRequest {
    return {
      ...request,
      challenge: request.challenge.toString('base64'),
      rp: {
        ...request.rp,
        id: this.rpID
      },
      user: {
        ...request.user,
        id: request.user.id.toString('base64')
      },
      excludeCredentials: (request.excludeCredentials ?? []).map(cred => ({
        ...cred,
        id: cred.id.toString('base64')
      }))
    }
  }

  private prepareAuthenticationRequest(
    request: FIDOAuthenticationRequest
  ): PasskeyAuthenticationRequest {
    return {
      ...request,
      challenge: request.challenge.toString('base64'),
      rpId: this.rpID,
      allowCredentials: (request.allowCredentials ?? []).map(cred => ({
        ...cred,
        id: cred.id.toString('base64')
      }))
    }
  }

  private convertRegistrationResult(
    result: PasskeyRegistrationResult
  ): FIDORegistrationResult {
    return {
      ...result,
      id: this.convertBase64ToBase64Url(result.id),
      rawId: Buffer.from(result.rawId, 'base64'),
      response: {
        ...result.response,
        clientDataJSON: Buffer.from(result.response.clientDataJSON, 'base64'),
        attestationObject: Buffer.from(
          result.response.attestationObject,
          'base64'
        )
      }
    }
  }

  private convertAuthenticationResult(
    result: PasskeyAuthenticationResult
  ): FIDOAuthenticationResult {
    return {
      ...result,
      id: this.convertBase64ToBase64Url(result.id),
      rawId: Buffer.from(result.rawId, 'base64'),
      response: {
        ...result.response,
        clientDataJSON: Buffer.from(result.response.clientDataJSON, 'base64'),
        authenticatorData: Buffer.from(
          result.response.authenticatorData,
          'base64'
        ),
        signature: Buffer.from(result.response.signature, 'base64'),
        userHandle: Buffer.from(result.response.userHandle, 'base64')
      }
    }
  }

  private convertBase64ToBase64Url(b64: string): string {
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]*$/g, '')
  }
}

export default new PasskeyService()
