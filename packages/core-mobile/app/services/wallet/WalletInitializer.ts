import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import SeedlessService from 'seedless/services/SeedlessService'
import { WalletType } from './types'

class WalletInitializer {
  async initialize({
    walletType,
    shouldRefreshPublicKeys
  }: {
    walletType: WalletType
    shouldRefreshPublicKeys: boolean
  }): Promise<void> {
    if (walletType === WalletType.SEEDLESS) {
      try {
        const storedPubKeys = await SeedlessPubKeysStorage.retrieve()
        if (shouldRefreshPublicKeys || storedPubKeys.length === 0) {
          const allKeys = await SeedlessService.getSessionKeysList()

          const pubKeys = transformKeyInfosToPubKeys(allKeys)
          Logger.info('saving public keys')
          await SeedlessPubKeysStorage.save(pubKeys)
        }
      } catch (error) {
        Logger.error(`Unable to save public keys`, error)
        throw new Error(`Unable to save public keys`)
      }
    }
  }

  public async terminate(walletType: WalletType): Promise<void> {
    if (walletType === WalletType.SEEDLESS) {
      // clear only the cache of public keys
      // as all data stored in SecureStorageService
      // is cleared on logout
      SeedlessPubKeysStorage.clearCache()
    }
  }
}

export default new WalletInitializer()
