import { CubeSigner, MfaReceipt } from '@cubist-dev/cubesigner-sdk'
import Config from 'react-native-config'
import {
  SignerSessionManager,
  envs,
  SignerSessionData
} from '@cubist-dev/cubesigner-sdk'

if (!Config.SEEDLESS_ORG_ID) {
  throw Error('SEEDLESS_ORG_ID is missing. Please check your env file.')
}

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService {
  private cubesigner: CubeSigner

  constructor() {
    this.cubesigner = new CubeSigner()
  }

  /**
   * Exchange an OIDC token for a CubeSigner session with token, mfa session info, etc.
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async login(oidcToken: string, mfaReceipt?: MfaReceipt | undefined) {
    return await this.cubesigner.oidcLogin(
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
  }

  /**
   * Logs in with an OIDC token and creates a session manager to retrieve session data, which includes a signer token.
   */
  async getSessionData(oidcToken: string): Promise<SignerSessionData> {
    const signResponse = await this.login(oidcToken)

    const oidcAuthResponse = signResponse.data()
    const sessionMgr = await SignerSessionManager.createFromSessionInfo(
      envs.gamma,
      Config.SEEDLESS_ORG_ID || '',
      oidcAuthResponse
    )

    return await sessionMgr.storage.retrieve()
  }
}

export default new SeedlessService()
