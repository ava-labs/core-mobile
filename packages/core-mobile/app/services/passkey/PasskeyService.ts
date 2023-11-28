import { Passkey } from 'react-native-passkey'
import {
  PasskeyAuthenticationRequest,
  PasskeyAuthenticationResult,
  PasskeyRegistrationRequest,
  PasskeyRegistrationResult
} from 'react-native-passkey/lib/typescript/Passkey'

class PasskeyService {
  get isSupported(): boolean {
    return Passkey.isSupported()
  }

  get rpID(): string {
    return 'core.app' // TODO: use 'test.core.app' for 'gamma' env
  }

  async register(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    challengeOptions: any,
    withSecurityKey: boolean
  ): Promise<unknown> {
    const request = this.prepareRegistrationRequest(challengeOptions)

    const result = await Passkey.register(request, { withSecurityKey })

    return this.convertRegistrationResultToCredential(result)
  }

  async authenticate(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    challengeOptions: any,
    withSecurityKey: boolean
  ): Promise<unknown> {
    const request = this.prepareAuthenticationRequest(challengeOptions)

    const result = await Passkey.authenticate(request, {
      withSecurityKey
    })

    return this.convertAuthenticationResultToCredential(result)
  }

  private prepareRegistrationRequest(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    challengeOptions: any
  ): PasskeyRegistrationRequest {
    const request = challengeOptions as PasskeyRegistrationRequest

    request.challenge = Buffer.from(request.challenge).toString('base64')
    request.user.id = Buffer.from(request.user.id).toString('base64')
    request.excludeCredentials = (request.excludeCredentials ?? []).map(
      cred => ({ ...cred, id: Buffer.from(cred.id).toString('base64') })
    )
    request.rp.id = this.rpID

    return request
  }

  private prepareAuthenticationRequest(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    challengeOptions: any
  ): PasskeyAuthenticationRequest {
    const request = challengeOptions as PasskeyAuthenticationRequest

    request.challenge = Buffer.from(request.challenge).toString('base64')
    request.rpId = this.rpID

    return request
  }

  private convertRegistrationResultToCredential(
    result: PasskeyRegistrationResult
  ): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converted = result as any
    converted.rawId = Buffer.from(result.rawId, 'base64')
    converted.response.clientDataJSON = Buffer.from(
      result.response.clientDataJSON,
      'base64'
    )
    converted.response.attestationObject = Buffer.from(
      result.response.attestationObject,
      'base64'
    )

    return converted
  }

  private convertAuthenticationResultToCredential(
    result: PasskeyAuthenticationResult
  ): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const converted = result as any
    converted.rawId = Buffer.from(result.rawId, 'base64')
    converted.response.clientDataJSON = Buffer.from(
      result.response.clientDataJSON,
      'base64'
    )
    converted.response.authenticatorData = Buffer.from(
      result.response.authenticatorData,
      'base64'
    )
    converted.response.signature = Buffer.from(
      result.response.signature,
      'base64'
    )
    converted.response.userHandle = Buffer.from(
      result.response.userHandle,
      'base64'
    )

    return converted
  }
}

export default new PasskeyService()
