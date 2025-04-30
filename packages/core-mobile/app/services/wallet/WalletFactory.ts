import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import PrivateKeyWalletInstance from './PrivateKeyWallet'
import MnemonicWalletInstance from './MnemonicWallet'
import { Wallet, WalletType } from './types'

class WalletFactory {
  async createWallet(
    accountIndex: number,
    walletType: WalletType
  ): Promise<Wallet> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
        const pubKeysStorage = new SeedlessPubKeysStorage()
        const pubKeys = await pubKeysStorage.retrieve()

        if (pubKeys.length === 0) throw new Error('Public keys not available')

        const addressPublicKey = pubKeys[accountIndex]

        if (!addressPublicKey) {
          throw new Error(`Public key not available for index ${accountIndex}`)
        }

        const client = await SeedlessService.session.getSignerClient()

        return new SeedlessWallet(client, addressPublicKey)
      }
      case WalletType.MNEMONIC:
        return MnemonicWalletInstance
      case WalletType.PRIVATE_KEY:
        return PrivateKeyWalletInstance
      default:
        throw new Error(
          `Unable to create wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletFactory()
