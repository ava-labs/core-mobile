import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { PubKeyType } from 'services/wallet/types'
import { assertNotUndefined } from 'utils/assertions'

export class KeystonePubKeysStorage {
  async save(pubKeys: PubKeyType): Promise<void> {
    await SecureStorageService.store(KeySlot.KeystonePubKeys, pubKeys)
  }

  async retrieve(): Promise<PubKeyType> {
    const pubKeys = await SecureStorageService.load<PubKeyType>(
      KeySlot.KeystonePubKeys
    )
    assertNotUndefined(pubKeys, 'no pubkeys found')
    return pubKeys
  }
}
