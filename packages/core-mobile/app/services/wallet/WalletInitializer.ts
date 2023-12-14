import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import { Avalanche, getXpubFromMnemonic } from '@avalabs/wallets-sdk'
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
          const allKeys = await SeedlessService.getSessionKeysList()
          const pubKeys = transformKeyInfosToPubKeys(allKeys)
          Logger.info('saving public keys')
          const pubKeysStorage = new SeedlessPubKeysStorage()
          await pubKeysStorage.save(pubKeys)
        } catch (error) {
          throw new Error(`Unable to save public keys: ${error}`)
        }
        break
      }
      case WalletType.MNEMONIC: {
        if (!mnemonic) throw new Error('Mnemonic not provided')

        Logger.info('getting xpub from mnemonic')

        const xpubPromise = getXpubFromMnemonic(mnemonic)
        const xpubXPPromise = new Promise<string>(resolve => {
          resolve(Avalanche.getXpubFromMnemonic(mnemonic))
        })
        const pubKeys = await Promise.allSettled([xpubPromise, xpubXPPromise])
        if (pubKeys[0].status === 'fulfilled') {
          MnemonicWalletInstance.xpub = pubKeys[0].value
        } else {
          throw new Error(`getXpubFromMnemonic failed, ${pubKeys[0].reason}`)
        }
        if (pubKeys[1].status === 'fulfilled') {
          MnemonicWalletInstance.xpubXP = pubKeys[1].value
        } else {
          throw new Error(
            `Avalanche.getXpubFromMnemonic failed, ${pubKeys[1].reason}`
          )
        }

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
        // no need to do anything here
        // as all data stored in SecureStorageService
        // is cleared on logout
        break
      case WalletType.MNEMONIC:
        MnemonicWalletInstance.mnemonic = undefined
        MnemonicWalletInstance.xpub = undefined
        MnemonicWalletInstance.xpubXP = undefined
        break
      default:
        throw new Error(
          `Unable to terminate wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletInitializer()
