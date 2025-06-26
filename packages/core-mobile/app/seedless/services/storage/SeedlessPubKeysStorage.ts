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

  static async removePublicKeysByIndex(accountIndex: number): Promise<void> {
    const pubKeys = await this.retrieve()

    // Filter out all public keys for this account index across all paths
    const filteredKeys = pubKeys.filter(key => {
      // Parse the derivation path to get the account index
      const pathParts = key.derivationPath.split('/')
      const lastPart = pathParts[pathParts.length - 1]
      if (!lastPart) return true // Keep keys with invalid paths
      const lastIndex = parseInt(lastPart, 10)
      return lastIndex !== accountIndex
    })

    // Save the updated list
    await this.save(filteredKeys)
  }

  static clearCache(): void {
    this.cache = undefined
  }
}
