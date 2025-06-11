import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import { Wallet, WalletType } from './types'
import MnemonicWalletInstance from './MnemonicWallet'

class WalletFactory {
  async createWallet(walletType: WalletType): Promise<Wallet> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
        const pubKeys = await SeedlessPubKeysStorage.retrieve()

        if (pubKeys.length === 0) throw new Error('Public keys not available')

        const client = await SeedlessService.session.getSignerClient()

        return new SeedlessWallet(client, pubKeys)
      }
      case WalletType.MNEMONIC:
        return MnemonicWalletInstance
      default:
        throw new Error(
          `Unable to create wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletFactory()
