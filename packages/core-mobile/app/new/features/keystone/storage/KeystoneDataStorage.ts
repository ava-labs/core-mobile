import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { assertNotUndefined } from 'utils/assertions'

export type KeystoneDataStorageType = {
  evm: string
  xp: string
  mfp: string
}

export class KeystoneDataStorage {
  private static cache: KeystoneDataStorageType | undefined = undefined

  static async save(keystoneData: KeystoneDataStorageType): Promise<void> {
    await SecureStorageService.store(KeySlot.KeystoneData, keystoneData)

    this.cache = keystoneData
  }

  static async retrieve(): Promise<KeystoneDataStorageType> {
    if (this.cache?.mfp && this.cache?.xp && this.cache?.evm) {
      return this.cache
    }

    const walletInfo = await SecureStorageService.load<KeystoneDataStorageType>(
      KeySlot.KeystoneData
    )
    assertNotUndefined(walletInfo.mfp, 'no mfp found')
    assertNotUndefined(walletInfo.xp, 'no xp found')
    assertNotUndefined(walletInfo.evm, 'no evm found')

    return walletInfo
  }
}
