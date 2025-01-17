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
import {
  base64ToBase64Url,
  base64UrlToBuffer,
  bufferToBase64Url
} from 'utils/data/base64'
import { showSimpleToast } from 'components/Snackbar'
import { FIDO_TIMEOUT, RP_ID, RP_NAME } from './consts'

class PasskeyService implements PasskeyServiceInterface {
  get isSupported(): boolean {
    return Passkey.isSupported()
  }

  async create(
    challengeOptions: FIDORegistrationRequest,
    withSecurityKey: boolean
  ): Promise<FIDORegistrationResult> {
    const request = this.prepareRegistrationRequest(
      challengeOptions,
      withSecurityKey
    )

    let result
    try {
      result = await Passkey.create(request)
    } catch (error) {
      showSimpleToast(JSON.stringify(error))
      throw error
    }
    return this.convertRegistrationResult(result)
  }

  async get(
    challengeOptions: FIDOAuthenticationRequest,
    withSecurityKey: boolean
  ): Promise<FIDOAuthenticationResult> {
    const request = this.prepareAuthenticationRequest(challengeOptions)

    const result = withSecurityKey
      ? await Passkey.getSecurityKey(request)
      : await Passkey.getPlatformKey(request)

    return this.convertAuthenticationResult(result)
  }

  private prepareRegistrationRequest(
    request: FIDORegistrationRequest,
    withSecurityKey: boolean
  ): PasskeyCreateRequest {
    let authenticatorSelection = request.authenticatorSelection
    if (Platform.OS === 'android') {
      authenticatorSelection = {
        authenticatorAttachment: withSecurityKey
          ? 'cross-platform'
          : 'platform',
        requireResidentKey: withSecurityKey ? false : true,
        residentKey: withSecurityKey ? 'discouraged' : 'required',
        userVerification: withSecurityKey ? 'preferred' : 'required'
      }
    }

    return {
      challenge: bufferToBase64Url(request.challenge),
      rp: {
        name: RP_NAME,
        id: RP_ID
      },
      user: {
        id: bufferToBase64Url(request.user.id),
        name: request.user.name,
        displayName: request.user.displayName
      },
      timeout: FIDO_TIMEOUT,
      excludeCredentials: (request.excludeCredentials ?? []).map(cred => ({
        transports: cred.transports as [],
        id: bufferToBase64Url(cred.id),
        type: cred.type
      })),
      pubKeyCredParams: request.pubKeyCredParams,
      authenticatorSelection,
      attestation: request.attestation
    }
  }

  private prepareAuthenticationRequest(
    request: FIDOAuthenticationRequest
  ): PasskeyGetRequest {
    return {
      challenge: bufferToBase64Url(request.challenge),
      rpId: RP_ID,
      timeout: FIDO_TIMEOUT,
      allowCredentials: (request.allowCredentials ?? []).map(cred => ({
        transports: cred.transports as [],
        id: bufferToBase64Url(cred.id),
        type: cred.type
      })),
      userVerification: request.userVerification
    }
  }

  private convertRegistrationResult(
    result: PasskeyCreateResult
  ): FIDORegistrationResult {
    return {
      type: result.type,
      id: base64ToBase64Url(result.id),
      rawId: base64UrlToBuffer(result.rawId) as Buffer,
      response: {
        clientDataJSON: base64UrlToBuffer(
          'clientDataJSON' in result.response
            ? result.response.clientDataJSON
            : ''
        ) as Buffer,
        attestationObject: base64UrlToBuffer(
          'attestationObject' in result.response
            ? result.response.attestationObject
            : ''
        ) as Buffer
      }
    }
  }

  private convertAuthenticationResult(
    result: PasskeyGetResult
  ): FIDOAuthenticationResult {
    return {
      id: base64ToBase64Url(result.id),
      type: result.type,
      rawId: base64UrlToBuffer(result.rawId) as Buffer,
      response: {
        clientDataJSON: base64UrlToBuffer(
          'clientDataJSON' in result.response
            ? result.response.clientDataJSON
            : ''
        ) as Buffer,
        authenticatorData: base64UrlToBuffer(
          'authenticatorData' in result.response
            ? result.response.authenticatorData
            : ''
        ) as Buffer,
        signature: base64UrlToBuffer(
          'signature' in result.response ? result.response.signature : ''
        ) as Buffer,
        userHandle: base64UrlToBuffer(
          'userHandle' in result.response ? result.response.userHandle : ''
        ) as Buffer
      }
    }
  }
}

export default new PasskeyService()
