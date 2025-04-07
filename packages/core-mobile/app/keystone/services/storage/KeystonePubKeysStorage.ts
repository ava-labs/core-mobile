import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { PubKeyType } from 'services/wallet/types'
import { assertNotUndefined } from 'utils/assertions'

type KeystonePubKeysStorageType = PubKeyType & {
  mfp: string
}

export class KeystonePubKeysStorage {
  async save(pubKeys: KeystonePubKeysStorageType): Promise<void> {
    await SecureStorageService.store(KeySlot.KeystonePubKeys, pubKeys)
  }

  async retrieve(): Promise<KeystonePubKeysStorageType> {
    const pubKeys = await SecureStorageService.load<KeystonePubKeysStorageType>(
      KeySlot.KeystonePubKeys
    )
    assertNotUndefined(pubKeys, 'no pubkeys found')
    return pubKeys
  }
}
