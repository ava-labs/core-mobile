import { KeyInfoApi, KeyType, Secp256k1 } from '@cubist-labs/cubesigner-sdk'
import Logger from 'utils/Logger'
import { ACCOUNT_NAME } from '../consts'
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
    scopes: [
      'sign:*',
      'manage:mfa',
      'manage:key:update:metadata',
      'manage:key:get'
    ],
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
   * Returns the account name for the primary signing key (Secp256k1.Ava).
   * @param accountIndex - The account index to get the account name for
   * @returns The acount name of the key
   */
  async getAccountName(accountIndex = 0): Promise<string | undefined> {
    try {
      const keys = await this.getSessionKeysList(Secp256k1.Ava)
      const metadata = this.getKeyInfo(keys, accountIndex)?.metadata
      return this.getAccountNameInMetadata(metadata)
    } catch (error) {
      Logger.warn('Failed to get name for the account index', error)
    }
  }

  /**
   * Sets the name for the primary signing key (avax).
   * @param name - The name to set for the key.
   * @param accountIndex - The account index to set the name for
   */
  async setAcountName(name: string, accountIndex: number): Promise<void> {
    try {
      const keys = await this.getSessionKeysList(Secp256k1.Ava)
      const keyInfo = this.getKeyInfo(keys, accountIndex)
      if (keyInfo === undefined) {
        throw Error()
      }
      const key = await this.sessionManager.getKey(keyInfo)
      key.setMetadataProperty(ACCOUNT_NAME, name)
    } catch (error) {
      // if this throws, we shouldn't block the user from using the app
      Logger.warn(`Failed to set metadata`, error)
    }
  }

  private getKeyInfo = (
    keys: KeyInfoApi[],
    accountIndex: number
  ): KeyInfoApi | undefined => {
    return keys.find(
      k =>
        Number(k.derivation_info?.derivation_path.split('/').pop()) ===
        accountIndex
    )
  }

  private getAccountNameInMetadata = (
    metadata: unknown
  ): string | undefined => {
    if (
      metadata !== null &&
      metadata !== undefined &&
      typeof metadata === 'object' &&
      ACCOUNT_NAME in metadata &&
      typeof metadata.account_name === 'string'
    ) {
      return metadata.account_name
    }
    return undefined
  }
}

export default new SeedlessService()
