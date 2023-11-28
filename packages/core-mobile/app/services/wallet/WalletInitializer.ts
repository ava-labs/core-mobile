import * as cs from '@cubist-labs/cubesigner-sdk'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import { SeedlessSessionStorage } from 'seedless/services/storage/SeedlessSessionStorage'
import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import { Avalanche, getXpubFromMnemonic } from '@avalabs/wallets-sdk'
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
        Logger.info('fetching public keys')
        const sessionStorage = new SeedlessSessionStorage()
        const session = await cs.CubeSigner.loadSignerSession(sessionStorage)
        const allKeys = await session.keys()
        const pubKeys = await transformKeyInfosToPubKeys(allKeys)

        Logger.info('saving public keys')
        const pubKeysStorage = new SeedlessPubKeysStorage()
        await pubKeysStorage.save(pubKeys)
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
        }
        if (pubKeys[1].status === 'fulfilled') {
          MnemonicWalletInstance.xpubXP = pubKeys[1].value
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
