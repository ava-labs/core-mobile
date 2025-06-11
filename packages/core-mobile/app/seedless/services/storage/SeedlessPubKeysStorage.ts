import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import Logger from 'utils/Logger'
import { AddressPublicKey } from 'utils/publicKeys'

export class SeedlessPubKeysStorage {
  private static cache: AddressPublicKey[] | undefined = undefined

  static async save(pubKeys: AddressPublicKey[]): Promise<void> {
    await SecureStorageService.store(KeySlot.SeedlessPubKeys, pubKeys)

    this.cache = pubKeys
  }

  static async retrieve(): Promise<AddressPublicKey[]> {
    if (this.cache && this.cache.length > 0) {
      return this.cache
    }

    let pubKeys: AddressPublicKey[] = []
    try {
      pubKeys = await SecureStorageService.load<AddressPublicKey[]>(
        KeySlot.SeedlessPubKeys
      )

      this.cache = pubKeys
    } catch (error) {
      Logger.info('Error retrieving public keys from storage:', error)
    }

    return pubKeys
  }

  static clear(): void {
    this.cache = undefined
  }
}
