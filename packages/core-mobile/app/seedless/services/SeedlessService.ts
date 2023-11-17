import {
  CubeSigner,
  MfaReceipt,
  SignResponse,
  TotpChallenge,
  UserInfo
} from '@cubist-dev/cubesigner-sdk'
import Config from 'react-native-config'
import { SignerSessionManager, envs } from '@cubist-dev/cubesigner-sdk'
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
   * Creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling resetTotpComplete
   */
  async resetTotpStart(): Promise<SignResponse<TotpChallenge>> {
    return this.cubeSigner.resetTotpStart()
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   */
  async verifyTotp(code: string): Promise<void> {
    return this.cubeSigner.verifyTotp(code)
  }
}

export default new SeedlessService()
