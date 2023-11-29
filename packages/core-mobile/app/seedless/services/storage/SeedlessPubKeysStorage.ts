import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { PubKeyType } from 'services/wallet/types'
import { assertNotUndefined } from 'utils/assertions'

export class SeedlessPubKeysStorage {
  async save(pubKeys: PubKeyType[]): Promise<void> {
    await SecureStorageService.store(KeySlot.SeedlessPubKeys, pubKeys)
  }

  async retrieve(): Promise<PubKeyType[]> {
    const pubKeys = await SecureStorageService.load<PubKeyType[]>(
      KeySlot.SeedlessPubKeys
    )
    assertNotUndefined(pubKeys, 'no pubkeys found')
    return pubKeys
  }
}
