import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import {
  Avalanche,
  getPublicKeyFromPrivateKey,
  getXpubFromMnemonic
} from '@avalabs/core-wallets-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { WalletType } from './types'
import MnemonicWalletInstance from './MnemonicWallet'
import PrivateKeyWalletInstance from './PrivateKeyWallet'

class WalletInitializer {
  async initialize({
    walletSecret,
    walletType,
    isLoggingIn
  }: {
    walletSecret?: string
    walletType: WalletType
    isLoggingIn: boolean
  }): Promise<void> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
        try {
          if (isLoggingIn) {
            const allKeys = await SeedlessService.getSessionKeysList()
            const pubKeys = transformKeyInfosToPubKeys(allKeys)
            Logger.info('saving public keys')
            const pubKeysStorage = new SeedlessPubKeysStorage()
            await pubKeysStorage.save(pubKeys)
          }
        } catch (error) {
          Logger.error(`Unable to save public keys`, error)
          throw new Error(`Unable to save public keys`)
        }
        break
      }
      case WalletType.MNEMONIC: {
        if (!walletSecret) throw new Error('Mnemonic not provided')

        Logger.info('getting xpub from mnemonic')

        const xpubPromise = getXpubFromMnemonic(walletSecret)
        const xpubXPPromise = new Promise<string>(resolve => {
          resolve(Avalanche.getXpubFromMnemonic(walletSecret))
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

        MnemonicWalletInstance.mnemonic = walletSecret
        break
      }
      case WalletType.PRIVATE_KEY: {
        if (!walletSecret) throw new Error('Private key not provided')

        PrivateKeyWalletInstance.privateKey = walletSecret
        const pubKey = getPublicKeyFromPrivateKey(
          Buffer.from(walletSecret, 'hex')
        )
        PrivateKeyWalletInstance.xpub = pubKey.toString('hex')
        PrivateKeyWalletInstance.xpubXP = pubKey.toString('hex')

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
      case WalletType.PRIVATE_KEY:
        PrivateKeyWalletInstance.privateKey = undefined
        PrivateKeyWalletInstance.xpub = undefined
        PrivateKeyWalletInstance.xpubXP = undefined
        break
      default:
        throw new Error(
          `Unable to terminate wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletInitializer()
