import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import BiometricsSDK from 'utils/BiometricsSDK'
import { PrivateKeyWallet } from 'services/wallet/PrivateKeyWallet'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import { Wallet, WalletType } from './types'
import { MnemonicWallet } from './MnemonicWallet'

class WalletFactory {
  async createWallet({
    walletId,
    walletType
  }: {
    walletId: string
    walletType: WalletType
  }): Promise<Wallet> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
        const pubKeys = await SeedlessPubKeysStorage.retrieve()

        if (pubKeys.length === 0) throw new Error('Public keys not available')

        const client = await SeedlessService.session.getSignerClient()

        return new SeedlessWallet(client, pubKeys)
      }
      case WalletType.MNEMONIC: {
        const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
        if (!walletSecret.success) {
          throw new Error('Failed to load wallet secret')
        }
        return new MnemonicWallet(walletSecret.value)
      }
      case WalletType.PRIVATE_KEY: {
        const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
        if (!walletSecret.success) {
          throw new Error('Failed to load wallet secret')
        }
        return new PrivateKeyWallet(walletSecret.value)
      }
      default:
        throw new Error(
          `Unable to create wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletFactory()
