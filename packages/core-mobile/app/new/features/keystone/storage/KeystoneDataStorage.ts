import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { ExtendedPublicKey } from 'services/ledger/types'
import { assertNotUndefined } from 'utils/assertions'

export type KeystoneDataStorageType = {
  evm: string
  xp: string
  mfp: string
  extendedPublicKeys: ExtendedPublicKey[]
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
      this.cache?.xp &&
      this.cache?.evm &&
      this.cache?.extendedPublicKeys
    ) {
      return this.cache
    }

    const walletInfo = await SecureStorageService.load<KeystoneDataStorageType>(
      KeySlot.KeystoneData
    )

    // if the extended public keys are not set, we need to set them to an empty array
    let updated = false

    if (!walletInfo.extendedPublicKeys) {
      walletInfo.extendedPublicKeys = []
      updated = true
    }

    assertNotUndefined(walletInfo.mfp, 'no mfp found')
    assertNotUndefined(walletInfo.xp, 'no xp found')
    assertNotUndefined(walletInfo.evm, 'no evm found')

    if (updated) {
      // if we updated the extended public keys, we need to save the new data
      await this.save(walletInfo)
    } else {
      this.cache = walletInfo
    }

    return walletInfo
  }

  /**
   * Store (or refresh) the Keystone xpub for a specific derivation path,
   * such as m/44'/9000'/2'. When the user scans a Keystone QR, we call this
   * with the exported key so it lives in secure storage and we can reuse it
   * later without asking the device again.
   */
  static async upsertExtendedKey(
    extendedPublicKey: ExtendedPublicKey
  ): Promise<void> {
    const data = await this.retrieve()
    const existingIndex = data.extendedPublicKeys.findIndex(
      key => key.path === extendedPublicKey.path
    )

    // If the key already exists, update it
    if (existingIndex >= 0) {
      data.extendedPublicKeys[existingIndex] = extendedPublicKey
    } else {
      // If the key doesn't exist, add it
      data.extendedPublicKeys.push(extendedPublicKey)
    }

    await this.save(data)
  }
}
