import { KeyInfo, KeyType, Secp256k1 } from '@cubist-labs/cubesigner-sdk'
import Logger from 'utils/Logger'
import { ACCOUNT_NAME } from '../consts'
import { SeedlessSessionManager } from './storage/SeedlessSessionManager'
import SeedlessSession from './SeedlessSession'
import { transformKeyInfosToPubKeys } from './transformKeyInfosToPubkeys'
import { SeedlessPubKeysStorage } from './storage/SeedlessPubKeysStorage'

/**
 * Service for cubesigner-sdk
 * https://github.com/cubist-labs/CubeSigner-TypeScript-SDK
 */
class SeedlessService {
  private sessionKeysListCache: KeyInfo[] | undefined = undefined

  // According to Cubist, CubeSigner creates a temporary session with the scopes manage:mfa:vote:fido and manage:mfa:vote:totp,
  // enabling users to approve or deny login attempts using MFA. Therefore, specifying only sign:* allows users
  // to proceed with signing up or signing in through MFA verification.
  session = new SeedlessSession({
    scopes: [
      'sign:*',
      'manage:mfa',
      'manage:key:update:metadata',
      'manage:key:get'
    ],
    sessionManager: new SeedlessSessionManager()
  })

  init({ onSessionExpired }: { onSessionExpired: () => void }): void {
    this.session.setOnSessionExpired(onSessionExpired)
  }

  async refreshPublicKeys(): Promise<void> {
    try {
      const storedPubKeys = await SeedlessPubKeysStorage.retrieve()
      if (storedPubKeys.length === 0) {
        this.refreshSessionKeys()
      }
    } catch (error) {
      Logger.error(`Unable to save public keys`, error)
      throw new Error(`Unable to save public keys`)
    }
  }

  /**
   * Returns the list of keys that this session has access to.
   */
  private async getSessionKeysList(type?: KeyType): Promise<KeyInfo[]> {
    let keysList: KeyInfo[] = []
    if (this.sessionKeysListCache && this.sessionKeysListCache.length > 0) {
      keysList = this.sessionKeysListCache
    } else {
      const signerSession = await this.session.getSignerClient()
      keysList = await signerSession.apiClient.sessionKeysList()
      this.sessionKeysListCache = keysList
    }

    return type !== undefined
      ? keysList.filter(k => k.key_type === type)
      : keysList
  }

  /**
   * Returns Mnemonic keys that this session has access to.
   */
  async getMnemonicKeysList(): Promise<KeyInfo | undefined> {
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
  async setAccountName(name: string, accountIndex: number): Promise<void> {
    try {
      const keys = await this.getSessionKeysList(Secp256k1.Ava)
      const keyInfo = this.getKeyInfo(keys, accountIndex)
      if (keyInfo === undefined) {
        throw Error()
      }
      const key = await this.session.getKey(keyInfo)
      // we don't await this because we don't want to block the user from using the app,
      // this request can take a bit of time
      // and in the case of metadata is updated concurrently in extension,
      // this request will retry a couple of times
      key.setMetadataProperty(ACCOUNT_NAME, name)
    } catch (error) {
      // if this throws, we shouldn't block the user from using the app
      Logger.warn(`Failed to set metadata`, error)
    }
  }

  private getKeyInfo = (
    keys: KeyInfo[],
    accountIndex: number
  ): KeyInfo | undefined => {
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

  private invalidateSessionKeysCache(): void {
    this.sessionKeysListCache = undefined
  }

  async refreshSessionKeys(): Promise<void> {
    this.invalidateSessionKeysCache()

    const allKeys = await this.getSessionKeysList()

    const pubKeys = transformKeyInfosToPubKeys(allKeys)
    Logger.info('saving public keys')
    await SeedlessPubKeysStorage.save(pubKeys)
  }
}

export default new SeedlessService()
