import { KeyInfoApi } from '@cubist-labs/cubesigner-sdk'
import Logger from 'utils/Logger'
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
    scopes: ['sign:*', 'manage:mfa', 'manage:key:update:metadata'],
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

  /**
   * Returns the metadata of the mnemonic key.
   */
  async getMetadata(): Promise<string | undefined> {
    try {
      const key = await this.getMnemonicKeysList()
      return key?.metadata
    } catch (error) {
      Logger.error('Failed to get metadata', error)
    }
  }

  /**
   * Sets the metadata of the mnemonic key.
   */
  async setMetadata(name: string): Promise<void> {
    try {
      const keyInfo = await this.getMnemonicKeysList()
      if (keyInfo) {
        const key = await this.sessionManager.getKey(keyInfo)
        key.setMetadata(name)
      }
    } catch (error) {
      Logger.error(`Failed to set metadata`, error)
    }
  }
}

export default new SeedlessService()
