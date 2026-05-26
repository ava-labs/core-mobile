import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { assertNotUndefined } from 'utils/assertions'

/**
 * Keystone QR-mode persisted wallet data.
 *
 * `xpByAccount` maps a BIP44 account index to its AVAX xpub at
 * `m/44'/9000'/<accountIndex>'`. Onboarding seeds this with `{ 0: ... }`;
 * additional accounts are populated on demand via the
 * `generateKeyDerivationCall` QR flow (see KeystoneService.addAccountXpub).
 *
 * EVM uses a single shared xpub at `m/44'/60'/0'` (depth-5 derivation for
 * all accounts), so it stays a single string.
 */
export type KeystoneDataStorageType = {
  evm: string
  xpByAccount: Record<number, string>
  mfp: string
}

export class KeystoneDataStorage {
  private static cache: KeystoneDataStorageType | undefined = undefined

  static async save(keystoneData: KeystoneDataStorageType): Promise<void> {
    await SecureStorageService.store(KeySlot.KeystoneData, keystoneData)

    this.cache = keystoneData
  }

  static async retrieve(): Promise<KeystoneDataStorageType> {
    if (
      this.cache?.mfp &&
      this.cache?.evm &&
      this.cache?.xpByAccount &&
      Object.keys(this.cache.xpByAccount).length > 0
    ) {
      return this.cache
    }

    const walletInfo = await SecureStorageService.load<KeystoneDataStorageType>(
      KeySlot.KeystoneData
    )
    assertNotUndefined(walletInfo.mfp, 'no mfp found')
    assertNotUndefined(walletInfo.evm, 'no evm found')
    assertNotUndefined(walletInfo.xpByAccount, 'no xpByAccount found')

    this.cache = walletInfo
    return walletInfo
  }
}
