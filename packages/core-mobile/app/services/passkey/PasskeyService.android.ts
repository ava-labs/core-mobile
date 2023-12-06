import Config from 'react-native-config'
import { InAppBrowser } from 'react-native-inappbrowser-reborn'
import {
  PasskeyAuthenticationRequest,
  PasskeyRegistrationRequest
} from 'react-native-passkey/lib/typescript/Passkey'
import {
  FIDOAuthenticationResult,
  FIDOAuthenticationRequest,
  FIDORegistrationResult,
  FIDORegistrationRequest,
  FidoType
} from 'services/passkey/types'
import { base64UrlToBuffer, bufferToBase64Url } from 'utils/data/base64'
import { FIDO_CALLBACK_URL, RP_ID, RP_NAME } from './consts'

if (!Config.SEEDLESS_ENVIRONMENT) {
  throw Error('SEEDLESS_ENVIRONMENT is missing. Please check your env file.')
}

const BROWSER_OPTIONS = {
  showTitle: false,
  toolbarColor: '#000000',
  secondaryToolbarColor: '#000000',
  navigationBarColor: '#000000',
  navigationBarDividerColor: '#ffffff',
  enableUrlBarHiding: true,
  enableDefaultShare: false,
  showInRecents: false
}

const IDENTITY_URL = 'https://identity.core.app/' // TODO use env

const FIDO_TIMEOUT = 90000 // 90 seconds

enum Action {
  REGISTER = 'register',
  AUTHENTICATE = 'authenticate'
}

type GenerateAuthUrlsParams =
  | {
      options: PasskeyRegistrationRequest
      action: Action.REGISTER
      fidoType: FidoType
    }
  | {
      options: PasskeyAuthenticationRequest
      action: Action.AUTHENTICATE
      fidoType?: never
    }

class PasskeyService {
  // unfortunately, we don't know if the device supports passkey
  // until we open browser and try to register
  get isSupported(): boolean {
    return true
  }

  async register(
    challengeOptions: FIDORegistrationRequest,
    withSecurityKey: boolean
  ): Promise<FIDORegistrationResult> {
    const options = this.prepareRegistrationOptions(challengeOptions)
    const { url, redirectUrl } = this.generateAuthUrls({
      options,
      action: Action.REGISTER,
      fidoType: withSecurityKey ? FidoType.YUBI_KEY : FidoType.PASS_KEY
    })
    const result = await this.startAuthSession(url, redirectUrl)
    return this.convertRegistrationResult(result)
  }

  async authenticate(
    challengeOptions: FIDOAuthenticationRequest,
    _withSecurityKey: boolean
  ): Promise<FIDOAuthenticationResult> {
    const options = this.prepareAuthenticationRequest(challengeOptions)
    const { url, redirectUrl } = this.generateAuthUrls({
      options,
      action: Action.AUTHENTICATE
    })
    const result = await this.startAuthSession(url, redirectUrl)
    return this.convertAuthenticationResult(result)
  }

  private prepareRegistrationOptions(
    options: FIDORegistrationRequest
  ): PasskeyRegistrationRequest {
    return {
      ...options,
      rp: {
        ...options.rp,
        name: RP_NAME,
        id: RP_ID
      },
      challenge: bufferToBase64Url(options.challenge),
      user: {
        ...options.user,
        id: bufferToBase64Url(options.user.id)
      },
      excludeCredentials: (options.excludeCredentials ?? []).map(cred => ({
        ...cred,
        id: bufferToBase64Url(cred.id)
      }))
    }
  }

  private prepareAuthenticationRequest(
    options: FIDOAuthenticationRequest
  ): PasskeyAuthenticationRequest {
    return {
      ...options,
      challenge: bufferToBase64Url(options.challenge),
      rpId: RP_ID,
      allowCredentials: (options.allowCredentials ?? []).map(cred => ({
        ...cred,
        id: bufferToBase64Url(cred.id)
      }))
    }
  }

  private generateAuthUrls({
    options,
    action,
    fidoType
  }: GenerateAuthUrlsParams): { url: string; redirectUrl: string } {
    // adjust timeout to 90 seconds from 15 seconds to allow users time to complete
    options.timeout = FIDO_TIMEOUT

    // https://www.corbado.com/blog/webauthn-resident-key-discoverable-credentials-passkeys
    if (action === Action.REGISTER) {
      if (fidoType === FidoType.PASS_KEY) {
        // requesting passkey as a discoverable credential
        options.authenticatorSelection = {
          authenticatorAttachment: 'platform',
          requireResidentKey: true,
          residentKey: 'required',
          userVerification: 'required'
        }
      } else if (fidoType === FidoType.YUBI_KEY) {
        // requesting yubikey as a non discoverable credential
        options.authenticatorSelection = {
          authenticatorAttachment: 'cross-platform',
          requireResidentKey: false,
          residentKey: 'discouraged',
          userVerification: 'preferred'
        }
      }
    }

    const encodedOptions = encodeURIComponent(JSON.stringify(options))

    const redirectUrl = `${FIDO_CALLBACK_URL}${action}`

    // TODO use env
    const url = `${IDENTITY_URL}${action}?options=${encodedOptions}&redirectUrl=${encodeURIComponent(
      redirectUrl
    )}`

    return { url, redirectUrl }
  }

  private async startAuthSession(
    url: string,
    redirectUrl: string
  ): Promise<string> {
    const response = await InAppBrowser.openAuth(
      url,
      redirectUrl,
      BROWSER_OPTIONS
    )

    if (response.type === 'cancel') {
      throw new Error('User cancelled session')
    }

    if (response.type === 'dismiss') {
      throw new Error('User dismissed session')
    }

    if (response.type !== 'success') {
      throw new Error('Something went wrong')
    }

    const result = new URL(response.url).searchParams.get('result')

    if (!result) throw new Error('Invalid response')

    return result
  }

  private convertRegistrationResult(result: string): FIDORegistrationResult {
    const decodedResult = JSON.parse(decodeURIComponent(result))

    return {
      ...decodedResult,
      id: decodedResult.id,
      rawId: base64UrlToBuffer(decodedResult.rawId),
      response: {
        ...decodedResult.response,
        clientDataJSON: base64UrlToBuffer(
          decodedResult.response.clientDataJSON
        ),
        attestationObject: base64UrlToBuffer(
          decodedResult.response.attestationObject
        )
      }
    }
  }

  private convertAuthenticationResult(
    result: string
  ): FIDOAuthenticationResult {
    const decodedResult = JSON.parse(decodeURIComponent(result))

    return {
      ...decodedResult,
      id: decodedResult.id,
      rawId: base64UrlToBuffer(decodedResult.rawId),
      response: {
        ...decodedResult.response,
        clientDataJSON: base64UrlToBuffer(
          decodedResult.response.clientDataJSON
        ),
        authenticatorData: base64UrlToBuffer(
          decodedResult.response.authenticatorData
        ),
        signature: base64UrlToBuffer(decodedResult.response.signature),
        userHandle: decodedResult.response.userHandle
          ? base64UrlToBuffer(decodedResult.response.userHandle)
          : decodedResult.response.userHandle // userHandle can be null
      }
    }
  }
}

export default new PasskeyService()
