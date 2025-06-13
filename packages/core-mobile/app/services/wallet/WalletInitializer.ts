import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import { WalletType } from './types'
import MnemonicWalletInstance from './MnemonicWallet'

class WalletInitializer {
  async initialize({
    mnemonic,
    walletType,
    shouldRefreshPublicKeys
  }: {
    mnemonic?: string
    walletType: WalletType
    shouldRefreshPublicKeys: boolean
  }): Promise<void> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
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
        break
      }
      case WalletType.MNEMONIC: {
        if (!mnemonic) throw new Error('Mnemonic not provided')

        MnemonicWalletInstance.mnemonic = mnemonic
        break
      }
      default:
        throw new Error(`Wallet type ${walletType} not supported`)
    }
  }

  public async terminate(walletType: WalletType): Promise<void> {
    switch (walletType) {
      case WalletType.SEEDLESS:
        // clear only the cache of public keys
        // as all data stored in SecureStorageService
        // is cleared on logout
        SeedlessPubKeysStorage.clearCache()
        break
      case WalletType.MNEMONIC:
        MnemonicWalletInstance.mnemonic = undefined
        break
      default:
        throw new Error(
          `Unable to terminate wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletInitializer()
