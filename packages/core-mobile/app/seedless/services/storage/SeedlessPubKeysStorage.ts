import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { AddressPublicKey } from 'utils/publicKeys/types'
import { assertNotUndefined } from 'utils/assertions'

export class SeedlessPubKeysStorage {
  private static cache: AddressPublicKey[] | undefined = undefined

  static async save(pubKeys: AddressPublicKey[]): Promise<void> {
    await SecureStorageService.store(KeySlot.SeedlessPubKeys, pubKeys)

    this.cache = pubKeys
  }

  static async retrieve(): Promise<AddressPublicKey[]> {
    if (this.cache) {
      return this.cache
    }
    const pubKeys = await SecureStorageService.load<AddressPublicKey[]>(
      KeySlot.SeedlessPubKeys
    )
    assertNotUndefined(pubKeys, 'no pubkeys found')
    this.cache = pubKeys

    return pubKeys
  }

  static clearCache(): void {
    this.cache = undefined
  }
}
