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
import { copyToClipboard } from 'utils/DeviceTools'
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

    try {
      const result = withSecurityKey
        ? await Passkey.createSecurityKey(request)
        : await Passkey.createPlatformKey(request)
      return this.convertRegistrationResult(result)
    } catch (error) {
      showSimpleToast('Error', error)
      throw error
    }
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
    copyToClipboard(result.response.clientDataJSON)
    showSimpleToast(result.response.clientDataJSON)
    let decodedResult = result
    if (Platform.OS === 'android') {
      decodedResult = JSON.parse(result as unknown as string)
    }
    return {
      type: decodedResult.type,
      id: base64ToBase64Url(decodedResult.id),
      rawId: base64UrlToBuffer(decodedResult.rawId) as Buffer,
      response: {
        clientDataJSON: base64UrlToBuffer(
          'clientDataJSON' in decodedResult.response
            ? decodedResult.response.clientDataJSON
            : ''
        ) as Buffer,
        attestationObject: base64UrlToBuffer(
          'attestationObject' in decodedResult.response
            ? decodedResult.response.attestationObject
            : ''
        ) as Buffer
      }
    }
  }

  private convertAuthenticationResult(
    result: PasskeyGetResult
  ): FIDOAuthenticationResult {
    let decodedResult = result
    if (Platform.OS === 'android') {
      decodedResult = JSON.parse(result as unknown as string)
    }

    return {
      id: base64ToBase64Url(decodedResult.id),
      type: result.type,
      rawId: base64UrlToBuffer(decodedResult.rawId) as Buffer,
      response: {
        clientDataJSON: base64UrlToBuffer(
          'clientDataJSON' in decodedResult.response
            ? decodedResult.response.clientDataJSON
            : ''
        ) as Buffer,
        authenticatorData: base64UrlToBuffer(
          'authenticatorData' in decodedResult.response
            ? decodedResult.response.authenticatorData
            : ''
        ) as Buffer,
        signature: base64UrlToBuffer(
          'signature' in decodedResult.response
            ? decodedResult.response.signature
            : ''
        ) as Buffer,
        userHandle: base64UrlToBuffer(
          'userHandle' in decodedResult.response
            ? decodedResult.response.userHandle
            : ''
        ) as Buffer
      }
    }
  }
}

export default new PasskeyService()
