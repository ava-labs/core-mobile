import assert from 'assert'
import {
  CubeSigner,
  SignerSession,
  SignerSessionManager
} from '@cubist-dev/cubesigner-sdk'
import { CognitoSessionManager } from '@cubist-dev/cubesigner-sdk/dist/src/session/cognito_manager'
import { Result } from 'types/result'

interface SetTotpParams {
  cognitoSessionManager: CognitoSessionManager
  signerSessionManager: SignerSessionManager
  totpCodeResolve: (totpUrl: string) => Promise<{ totpCode: string }>
  existingTotpCode?: string
}

export class TotpSet {}

export class RequiresMfa extends Error {}

export class WrongMfaCode extends Error {}

class AuthenticatorService {
  async setTotp({
    cognitoSessionManager,
    signerSessionManager,
    totpCodeResolve,
    existingTotpCode
  }: SetTotpParams): Promise<Result<TotpSet, RequiresMfa | WrongMfaCode>> {
    const cs = new CubeSigner({
      sessionMgr: cognitoSessionManager
    })
    let response = await cs.resetTotpStart()
    if (response.requiresMfa()) {
      //mfa already exists, we need approval
      if (!existingTotpCode) {
        return { success: false, error: new RequiresMfa() }
      }
      const signerSession = new SignerSession(signerSessionManager)
      response = await response.approveTotp(signerSession, existingTotpCode)
      if (response.requiresMfa()) {
        return { success: false, error: new WrongMfaCode() }
      }
    }

    //now we have totp_url
    const totpChallenge = response.data()
    assert(totpChallenge.totpUrl) //throw if no totpUrl, something is broken
    const { totpCode } = await totpCodeResolve(totpChallenge.totpUrl)
    await totpChallenge.answer(totpCode)
    return { success: true, value: new TotpSet() }
  }
}

export default new AuthenticatorService()
