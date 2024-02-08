import { KeyInfoApi } from '@cubist-labs/cubesigner-sdk'
import { SeedlessSessionStorage } from './storage/SeedlessSessionStorage'
import SeedlessSessionManager from './SeedlessSessionManager'

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService {
  sessionManager = new SeedlessSessionManager({
    scopes: ['sign:*'],
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
