import { Passkey } from 'react-native-passkey'
import {
  PasskeyAuthenticationRequest,
  PasskeyAuthenticationResult,
  PasskeyRegistrationRequest,
  PasskeyRegistrationResult
} from 'react-native-passkey/lib/typescript/Passkey'
import { AddFidoChallenge, MfaFidoChallenge } from '@cubist-labs/cubesigner-sdk'

class PasskeyService {
  get isSupported(): boolean {
    return Passkey.isSupported()
  }

  get rpID(): string {
    return 'core.app' // TODO: use 'test.core.app' for 'gamma' env
  }

  async register(
    challenge: AddFidoChallenge,
    withSecurityKey: boolean
  ): Promise<void> {
    const request = this.prepareRegistrationRequest(challenge)

    const result = await Passkey.register(request, { withSecurityKey })

    const credential = this.convertRegistrationResultToCredential(result)

    await challenge.answer(credential)
  }

  async authenticate(
    challenge: MfaFidoChallenge,
    withSecurityKey: boolean
  ): Promise<string> {
    try {
      const request = this.prepareAuthenticationRequest(challenge)

      const result = await Passkey.authenticate(request, {
        withSecurityKey
      })

      const credential = this.convertAuthenticationResultToCredential(result)

      const mfaRequestInfo = await challenge.answer(credential)

      if (mfaRequestInfo.receipt?.confirmation) {
        return mfaRequestInfo.receipt.confirmation
      } else {
        throw new Error('Passkey authentication failed')
      }
    } catch (e) {
      throw new Error('Passkey authentication failed')
    }
  }

  private prepareRegistrationRequest(
    challenge: AddFidoChallenge
  ): PasskeyRegistrationRequest {
    const request = challenge.options as PasskeyRegistrationRequest

    request.challenge = Buffer.from(request.challenge).toString('base64')
    request.user.id = Buffer.from(request.user.id).toString('base64')
    request.excludeCredentials = (request.excludeCredentials ?? []).map(
      cred => ({ ...cred, id: Buffer.from(cred.id).toString('base64') })
    )
    request.rp.id = this.rpID

    return request
  }

  private prepareAuthenticationRequest(
    challenge: MfaFidoChallenge
  ): PasskeyAuthenticationRequest {
    const request = challenge.options as PasskeyAuthenticationRequest

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
