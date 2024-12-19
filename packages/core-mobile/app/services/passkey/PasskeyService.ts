import { Platform } from 'react-native'
import {
  Passkey,
  PasskeyCreateRequest,
  PasskeyCreateResult,
  PasskeyGetRequest,
  PasskeyGetResult
} from 'react-native-passkey'
import {
  FIDOAuthenticationResult,
  FIDOAuthenticationRequest,
  FIDORegistrationResult,
  FIDORegistrationRequest,
  PasskeyServiceInterface
} from 'services/passkey/types'
import { base64ToBase64Url } from 'utils/data/base64'
import { FIDO_TIMEOUT, RP_ID, RP_NAME } from './consts'

class PasskeyService implements PasskeyServiceInterface {
  get isSupported(): boolean {
    return Passkey.isSupported() && Platform.OS === 'ios'
  }

  async create(
    challengeOptions: FIDORegistrationRequest,
    withSecurityKey: boolean
  ): Promise<FIDORegistrationResult> {
    const request = this.prepareRegistrationRequest(challengeOptions)
    const result = await Passkey.create({
      ...request,
      authenticatorSelection: {
        authenticatorAttachment: withSecurityKey ? 'cross-platform' : undefined
      }
    })
    return this.convertRegistrationResult(result)
  }

  async get(
    challengeOptions: FIDOAuthenticationRequest,
    _: boolean
  ): Promise<FIDOAuthenticationResult> {
    const request = this.prepareAuthenticationRequest(challengeOptions)

    const result = await Passkey.get(request)

    return this.convertAuthenticationResult(result)
  }

  private prepareRegistrationRequest(
    request: FIDORegistrationRequest
  ): PasskeyCreateRequest {
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
        transports: cred.transports as [],
        id: cred.id.toString('base64')
      }))
    }
  }

  private prepareAuthenticationRequest(
    request: FIDOAuthenticationRequest
  ): PasskeyGetRequest {
    return {
      ...request,
      challenge: request.challenge.toString('base64'),
      rpId: RP_ID,
      timeout: FIDO_TIMEOUT,
      allowCredentials: (request.allowCredentials ?? []).map(cred => ({
        ...cred,
        transports: cred.transports as [],
        id: cred.id.toString('base64')
      }))
    }
  }

  private convertRegistrationResult(
    result: PasskeyCreateResult
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
    result: PasskeyGetResult
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
