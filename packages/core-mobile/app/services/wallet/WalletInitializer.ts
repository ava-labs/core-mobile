import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import Logger from 'utils/Logger'
import SeedlessService from 'seedless/services/SeedlessService'
import { WalletType } from './types'
import MnemonicWalletInstance from './MnemonicWallet'

class WalletInitializer {
  async initialize({
    mnemonic,
    walletType
  }: {
    mnemonic?: string
    walletType: WalletType
  }): Promise<void> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
        try {
          await SeedlessService.refreshSessionKeys()
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
