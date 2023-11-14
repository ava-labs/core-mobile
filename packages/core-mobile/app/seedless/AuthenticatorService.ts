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
  totpCodeResolve: (totpUrl: string) => Promise<{ totpCode: string }>
  existingTotpCode?: string
}

class AuthenticatorService {
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
