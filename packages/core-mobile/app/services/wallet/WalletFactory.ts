import * as cs from '@cubist-labs/cubesigner-sdk'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import { SeedlessSessionStorage } from 'seedless/services/storage/SeedlessSessionStorage'
import { Wallet, WalletType } from './types'
import MnemonicWalletInstance from './MnemonicWallet'

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

        const sessionStorage = new SeedlessSessionStorage()
        const session = await cs.CubeSigner.loadSignerSession(sessionStorage)
        return new SeedlessWallet(session, addressPublicKey)
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
