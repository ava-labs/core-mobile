import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import { Avalanche, getXpubFromMnemonic } from '@avalabs/core-wallets-sdk'
import PrivateKeyWalletInstance from './PrivateKeyWallet'
import { Wallet, WalletType } from './types'
import { MnemonicWallet, MnemonicWalletFactory } from './MnemonicWallet'
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

  async createMnemonicWallet(walletSecret: string): Promise<MnemonicWallet> {
    if (!walletSecret) throw new Error('Mnemonic not provided')
    const mnemonicWallet = MnemonicWalletFactory.create(walletSecret)
    const xpubPromise = getXpubFromMnemonic(walletSecret)
    const xpubXPPromise = new Promise<string>(resolve => {
      resolve(Avalanche.getXpubFromMnemonic(walletSecret))
    })
    const pubKeys = await Promise.allSettled([xpubPromise, xpubXPPromise])
    if (pubKeys[0].status === 'fulfilled') {
      mnemonicWallet.xpub = pubKeys[0].value
    } else {
      throw new Error(`getXpubFromMnemonic failed, ${pubKeys[0].reason}`)
    }
    if (pubKeys[1].status === 'fulfilled') {
      mnemonicWallet.xpubXP = pubKeys[1].value
    } else {
      throw new Error(
        `Avalanche.getXpubFromMnemonic failed, ${pubKeys[1].reason}`
      )
    }
    mnemonicWallet.mnemonic = walletSecret
    return mnemonicWallet
  }
}

export default new WalletFactory()
