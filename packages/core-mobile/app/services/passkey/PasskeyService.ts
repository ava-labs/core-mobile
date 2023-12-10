import { Platform } from 'react-native'
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
  FIDORegistrationRequest,
  PasskeyServiceInterface
} from 'services/passkey/types'
import { base64ToBase64Url } from 'utils/data/base64'
import { FIDO_TIMEOUT, RP_ID, RP_NAME } from './consts'

if (!Config.SEEDLESS_ENVIRONMENT) {
  throw Error('SEEDLESS_ENVIRONMENT is missing. Please check your env file.')
}

class PasskeyService implements PasskeyServiceInterface {
  get isSupported(): boolean {
    return Passkey.isSupported() && Platform.OS === 'ios'
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
        name: RP_NAME,
        id: RP_ID
      },
      user: {
        ...request.user,
        id: request.user.id.toString('base64')
      },
      timeout: FIDO_TIMEOUT,
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
      rpId: RP_ID,
      timeout: FIDO_TIMEOUT,
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
      id: base64ToBase64Url(result.id),
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
      id: base64ToBase64Url(result.id),
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
}

export default new PasskeyService()
