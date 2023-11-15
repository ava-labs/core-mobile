import {
  CognitoSessionManager,
  CubeSigner,
  SignerSession,
  SignerSessionManager
} from '@cubist-dev/cubesigner-sdk'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'

interface SetTotpParams {
  cognitoSessionManager: CognitoSessionManager
  signerSessionManager: SignerSessionManager
  /**
   * This callback function should pass totpUrl to Authenticator app and return promise which
   * resolves to Authenticator code generated with given totpUrl.
   */
  totpCodeResolve: (totpUrl: string) => Promise<{ totpCode: string }>
  /**
   * If user already has Authenticator app here needs to be provided code from that Auth app which is
   * about to be replaced.
   */
  existingTotpCode?: string
}

class AuthenticatorService {
  /**
   * setTotp is used to initiate registration of Authenticator app to Cubist.
   * We pass session managers with adequate scopes.
   * Since only one Authenticator app can be registered we optionally pass {@link SetTotpParams.existingTotpCode}
   * as authentication to replace existing Authenticator app.
   */
  async setTotp({
    cognitoSessionManager,
    signerSessionManager,
    totpCodeResolve,
    existingTotpCode
  }: SetTotpParams): Promise<Result<void, TotpErrors>> {
    const cs = new CubeSigner({
      sessionMgr: cognitoSessionManager
    })
    let response = await cs.resetTotpStart()
    if (response.requiresMfa()) {
      //mfa already exists, we need approval
      if (!existingTotpCode) {
        return {
          success: false,
          error: new TotpErrors({ name: 'RequiresMfa', message: 'RequiresMfa' })
        }
      }
      const signerSession = new SignerSession(signerSessionManager)
      response = await response.approveTotp(signerSession, existingTotpCode)
      if (response.requiresMfa()) {
        return {
          success: false,
          error: new TotpErrors({
            name: 'WrongMfaCode',
            message: 'WrongMfaCode'
          })
        }
      }
    }

    //now we have totp_url
    const totpChallenge = response.data()
    if (!totpChallenge.totpUrl) {
      return {
        success: false,
        error: new TotpErrors({
          name: 'UnexpectedError',
          message: 'Registering Authenticator failed, please try again.'
        })
      }
    }
    const { totpCode } = await totpCodeResolve(totpChallenge.totpUrl)
    await totpChallenge.answer(totpCode)
    return { success: true }
  }
}

export default new AuthenticatorService()
