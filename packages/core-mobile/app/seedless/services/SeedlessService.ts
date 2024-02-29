import { KeyInfoApi, KeyType, Secp256k1 } from '@cubist-labs/cubesigner-sdk'
import Logger from 'utils/Logger'
import { SeedlessSessionStorage } from './storage/SeedlessSessionStorage'
import SeedlessSessionManager from './SeedlessSessionManager'

// AVAX_ACCOUNT_EXT_PUB_KEY_DERIV_PATH
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
  async getSessionKeysList(type?: KeyType): Promise<KeyInfoApi[]> {
    const signerSession = await this.sessionManager.getSignerSession()
    const keysList = await signerSession.sessionKeysList()
    return type !== undefined
      ? keysList.filter(k => k.key_type === type)
      : keysList
  }

  /**
   * Returns Mnemonic keys that this session has access to.
   */
  async getMnemonicKeysList(): Promise<KeyInfoApi | undefined> {
    const keysList = await this.getSessionKeysList('Mnemonic')
    return keysList.find(k => k.key_type === 'Mnemonic')
  }

  /**
   * Returns the names for the primary signing key (avax).
   * @param accountIndex - The account index to get the name for
   * @returns The name of the key
   */
  async getNameforDerivedPath(accountIndex = 0): Promise<string | undefined> {
    try {
      const keys = await this.getSessionKeysList(Secp256k1.Ava)
      return this.getMetadataFromKeys(keys, accountIndex)?.metadata
    } catch (error) {
      Logger.warn('Failed to get name for the account index', error)
    }
  }

  getMetadataFromKeys = (
    keys: KeyInfoApi[],
    accountIndex: number
  ): KeyInfoApi | undefined => {
    return keys.find(
      k =>
        Number(k.derivation_info?.derivation_path.split('/').pop()) ===
        accountIndex
    )
  }

  /**
   * Sets the name for the primary signing key (avax).
   * @param name - The name to set for the key.
   * @param accountIndex - The account index to set the name for
   */
  async setNameForDerivedPath(
    name: string,
    accountIndex: number
  ): Promise<void> {
    try {
      const keys = await this.getSessionKeysList(Secp256k1.Ava)
      const keyInfo = this.getMetadataFromKeys(keys, accountIndex)
      if (keyInfo === undefined) {
        throw Error()
      }
      const key = await this.sessionManager.getKey(keyInfo)
      key.setMetadata(name)
    } catch (error) {
      // if this throws, we shouldn't block the user from using the app
      Logger.warn(`Failed to set metadata`, error)
    }
  }
}

export default new SeedlessService()
