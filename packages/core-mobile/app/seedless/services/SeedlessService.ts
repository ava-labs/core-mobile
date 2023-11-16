import { CubeSigner, MfaReceipt, UserInfo } from '@cubist-dev/cubesigner-sdk'
import Config from 'react-native-config'
import { SignerSessionManager, envs } from '@cubist-dev/cubesigner-sdk'
import { assertNotUndefined } from 'utils/assertions'
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
  #cubeSigner: CubeSigner

  private get cubeSigner(): CubeSigner {
    assertNotUndefined(this.#cubeSigner)
    return this.#cubeSigner
  }

  private set cubeSigner(cubeSigner: CubeSigner) {
    this.#cubeSigner = cubeSigner
  }

  /**
   * Exchange an OIDC token for a CubeSigner session with token, mfa session info, etc.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async login(oidcToken: string, mfaReceipt?: MfaReceipt | undefined) {
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

    const sessionMgr = await SignerSessionManager.createFromSessionInfo(
      envs.gamma,
      SEEDLESS_ORG_ID,
      signResponse.data(),
      new SeedlessSessionStorage()
    )

    this.cubeSigner = new CubeSigner({
      env: envs.gamma,
      orgId: SEEDLESS_ORG_ID,
      sessionMgr
    })
  }

  /**
   * Returns a session manager that can be used to retrieve session data.
   */
  async getSessionManager(): Promise<SignerSessionManager> {
    return this.cubeSigner.sessionMgr as SignerSessionManager
  }

  /**
   * Retrieves information about the current user.
   */
  async aboutMe(): Promise<UserInfo> {
    return this.cubeSigner.aboutMe()
  }

  /**
   * Retrieves information about the current user's mfa.
   */
  async userMfa(): Promise<UserInfo['mfa']> {
    return (await this.aboutMe()).mfa
  }
}

export default new SeedlessService()
