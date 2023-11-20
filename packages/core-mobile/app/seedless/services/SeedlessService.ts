import {
  CubeSigner,
  MfaReceipt,
  TotpChallenge,
  UserInfo,
  SignerSessionManager,
  envs
} from '@cubist-dev/cubesigner-sdk'
import Config from 'react-native-config'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'
import { SeedlessSessionStorage } from './SeedlessSessionStorage'

if (!Config.SEEDLESS_ORG_ID) {
  throw Error('SEEDLESS_ORG_ID is missing. Please check your env file.')
}

const SEEDLESS_ORG_ID = Config.SEEDLESS_ORG_ID

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService {
  private totpChallenge?: TotpChallenge
  /**
   * Returns a CubeSigner instance
   */
  private async getCubeSigner(): Promise<CubeSigner> {
    const storage = new SeedlessSessionStorage()
    const sessionMgr = await SignerSessionManager.loadFromStorage(storage)
    return new CubeSigner({ sessionMgr })
  }

  /**
   * Returns a session manager that can be used to retrieve session data.
   */
  // @ts-expect-error
  private async getSessionManager(): Promise<SignerSessionManager> {
    return (await this.getCubeSigner()).sessionMgr as SignerSessionManager
  }

  /**
   * Exchange an OIDC token for a CubeSigner session with token, mfa session info, etc.
   */
  async login(
    oidcToken: string,
    mfaReceipt?: MfaReceipt | undefined
  ): Promise<void> {
    const signResponse = await new CubeSigner().oidcLogin(
      oidcToken,
      Config.SEEDLESS_ORG_ID || '',
      ['sign:*', 'manage:*'],
      {
        // How long singing with a particular token works from the token creation
        auth_lifetime: 5 * 60, // 5 minutes
        // How long a refresh token is valid, the user has to unlock Core in this timeframe otherwise they will have to re-login
        // Sessions expire either if the session lifetime expires or if a refresh token expires before a new one is generated
        refresh_lifetime: 90 * 24 * 60 * 60, // 90 days
        // How long till the user absolutely must sign in again
        session_lifetime: 1 * 365 * 24 * 60 * 60 // 1 year
      },
      mfaReceipt
    )

    await SignerSessionManager.createFromSessionInfo(
      envs.gamma,
      SEEDLESS_ORG_ID,
      signResponse.data(),
      new SeedlessSessionStorage()
    )
  }

  /**
   * Retrieves information about the current user.
   */
  async aboutMe(): Promise<UserInfo> {
    return (await this.getCubeSigner()).aboutMe()
  }

  /**
   * Retrieves information about the current user's mfa.
   */
  async userMfa(): Promise<UserInfo['mfa']> {
    return (await this.aboutMe()).mfa
  }

  /**
   * setTotp is used to initiate registration of Authenticator app to Cubist.
   * it creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling resetTotpComplete
   */
  async setTotp(): Promise<Result<string, TotpErrors>> {
    const cubeSigner = await this.getCubeSigner()
    const response = await cubeSigner.resetTotpStart()
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
   * registration would fail if totpChallenge.answer() is not called.
   */
  verifyCode = async (code: string): Promise<Result<void, TotpErrors>> => {
    try {
      await this.totpChallenge?.answer(code)
      const cubeSigner = await this.getCubeSigner()
      await cubeSigner.verifyTotp(code)
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

export default new SeedlessService()
