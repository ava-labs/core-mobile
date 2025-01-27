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
  FIDORegistrationRequest
} from 'services/passkey/types'
import {
  base64ToBase64Url,
  base64UrlToBuffer,
  bufferToBase64Url
} from 'utils/data/base64'
import { FIDO_TIMEOUT, RP_ID, RP_NAME } from './consts'

class PasskeyService {
  get isSupported(): boolean {
    return Passkey.isSupported()
  }

  async createCredential(
    challengeOptions: FIDORegistrationRequest,
    withSecurityKey: boolean
  ): Promise<FIDORegistrationResult> {
    const request = this.prepareRegistrationRequest(
      challengeOptions,
      withSecurityKey
    )

    const result = withSecurityKey
      ? await Passkey.createSecurityKey(request)
      : await Passkey.createPlatformKey(request)
    return this.convertRegistrationResult(result)
  }

  async getCredential(
    challengeOptions: FIDOAuthenticationRequest,
    withSecurityKey: boolean
  ): Promise<FIDOAuthenticationResult> {
    const request = this.prepareAuthenticationRequest(challengeOptions)

    // use Passkey.get() to get the credential
    // on iOS, Passkey.getSecurityKey() only shows prompt with security key
    // since currently we don't have a way to detect if the recovery method is for security key or platform key
    // we want to always show the prompt with both options on iOS
    // TODO: once we have support from Cubist to store and send the FIDO metadata, we can show more accurate prompt to user
    const result = withSecurityKey
      ? await Passkey.get(request)
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
      rawId: base64UrlToBuffer(result.rawId),
      response: {
        clientDataJSON: base64UrlToBuffer(
          'clientDataJSON' in result.response
            ? result.response.clientDataJSON
            : ''
        ),
        attestationObject: base64UrlToBuffer(
          'attestationObject' in result.response
            ? result.response.attestationObject
            : ''
        )
      }
    }
  }

  private convertAuthenticationResult(
    result: PasskeyGetResult
  ): FIDOAuthenticationResult {
    return {
      id: base64ToBase64Url(result.id),
      type: result.type,
      rawId: base64UrlToBuffer(result.rawId),
      response: {
        clientDataJSON: base64UrlToBuffer(
          'clientDataJSON' in result.response
            ? result.response.clientDataJSON
            : ''
        ),
        authenticatorData: base64UrlToBuffer(
          'authenticatorData' in result.response
            ? result.response.authenticatorData
            : ''
        ),
        signature: base64UrlToBuffer(
          'signature' in result.response ? result.response.signature : ''
        ),
        userHandle: base64UrlToBuffer(
          'userHandle' in result.response ? result.response.userHandle : ''
        )
      }
    }
  }
}

export default new PasskeyService()
