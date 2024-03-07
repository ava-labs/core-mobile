import { KeyInfoApi } from '@cubist-labs/cubesigner-sdk'
import { SeedlessSessionStorage } from './storage/SeedlessSessionStorage'
import SeedlessSessionManager from './SeedlessSessionManager'

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService {
  // According to Cubist, CubeSigner creates a temporary session with the scopes manage:mfa:vote:fido and manage:mfa:vote:totp,
  // enabling users to approve or deny login attempts using MFA. Therefore, specifying only sign:* allows users
  // to proceed with signing up or signing in through MFA verification.
  sessionManager = new SeedlessSessionManager({
    scopes: ['sign:*', 'manage:mfa'],
    sessionStorage: new SeedlessSessionStorage()
  })

  /**
   * Returns the list of keys that this session has access to.
   */
  async getSessionKeysList(): Promise<KeyInfoApi[]> {
    const signerSession = await this.sessionManager.getSignerSession()
    return signerSession.sessionKeysList()
  }

  /**
   * Returns Mnemonic keys that this session has access to.
   */
  async getMnemonicKeysList(): Promise<KeyInfoApi | undefined> {
    const keysList = await this.getSessionKeysList()
    return keysList.find(k => k.key_type === 'Mnemonic')
  }
}

export default new SeedlessService()
