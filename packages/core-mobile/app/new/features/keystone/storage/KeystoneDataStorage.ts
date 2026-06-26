import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { assertNotUndefined } from 'utils/assertions'

export type KeystoneDataStorageType = {
  evm: string
  // X/P xpub is optional: a Keystone wallet can be onboarded (or an account
  // created) without X/P data — e.g. while the device is disconnected, pending
  // the on-demand X/P enabler (CP-13335). EVM/BTC signing must still work; only
  // X/P operations require it, enforced lazily via KeystoneWallet's xpubXP getter.
  xp?: string
  mfp: string
}

export class KeystoneDataStorage {
  private static cache: KeystoneDataStorageType | undefined = undefined

  static async save(keystoneData: KeystoneDataStorageType): Promise<void> {
    await SecureStorageService.store(KeySlot.KeystoneData, keystoneData)

    this.cache = keystoneData
  }

  static async retrieve(): Promise<KeystoneDataStorageType> {
    if (this.cache?.mfp && this.cache?.evm) {
      return this.cache
    }

    const walletInfo = await SecureStorageService.load<KeystoneDataStorageType>(
      KeySlot.KeystoneData
    )
    // Only mfp + evm are required to construct a usable signer. xp (X/P xpub) is
    // intentionally NOT asserted here so EVM/BTC signing works for Keystone
    // wallets without X/P data; X/P access throws lazily via the xpubXP getter.
    assertNotUndefined(walletInfo.mfp, 'no mfp found')
    assertNotUndefined(walletInfo.evm, 'no evm found')

    return walletInfo
  }
}
