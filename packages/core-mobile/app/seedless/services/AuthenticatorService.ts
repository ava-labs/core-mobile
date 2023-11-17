import { TotpChallenge } from '@cubist-dev/cubesigner-sdk'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'
import SeedlessService from './SeedlessService'

class AuthenticatorService {
  private totpChallenge?: TotpChallenge

  /**
   * setTotp is used to initiate registration of Authenticator app to Cubist.
   */
  async setTotp(): Promise<Result<string, TotpErrors>> {
    const response = await SeedlessService.resetTotpStart()
    if (response.requiresMfa()) {
      return {
        success: false,
        error: new TotpErrors({
          name: 'RequiresMfa',
          message: 'Registering Authenticator failed, please try again.'
        })
      }
    }
    const challenge = response.data()
    if (!challenge.totpUrl) {
      return {
        success: false,
        error: new TotpErrors({
          name: 'UnexpectedError',
          message: 'Registering Authenticator failed, please try again.'
        })
      }
    }
    this.totpChallenge = challenge
    return { success: true, value: challenge.totpUrl }
  }

  /**
   * verifyCode is used to verify the code from Authenticator app.
   * and calls resetTotpComplete from totpChallenge.answer() if it is part of the registration flow.
   */
  verifyCode = async (code: string): Promise<Result<void, TotpErrors>> => {
    try {
      await this.totpChallenge?.answer(code)
      await SeedlessService.verifyTotp(code)
      this.totpChallenge = undefined
      return { success: true }
    } catch {
      return {
        success: false,
        error: new TotpErrors({
          name: 'WrongMfaCode',
          message: 'WrongMfaCode'
        })
      }
    }
  }
}

export default new AuthenticatorService()
