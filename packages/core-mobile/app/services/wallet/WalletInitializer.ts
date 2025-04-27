import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import { KeystonePubKeysStorage } from 'keystone/services/storage/KeystonePubKeysStorage'
import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import { Avalanche, getXpubFromMnemonic } from '@avalabs/core-wallets-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import { WalletType } from './types'
import MnemonicWalletInstance from './MnemonicWallet'
import KeystoneWalletInstance from './KeystoneWallet'

class WalletInitializer {
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async initialize({
    mnemonic,
    walletType,
    isLoggingIn,
    xpub,
    xpubXP,
    masterfingerprint
  }: {
    mnemonic?: string
    walletType: WalletType
    isLoggingIn: boolean
    xpub?: string
    xpubXP?: string
    masterfingerprint?: string
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
      case WalletType.KEYSTONE: {
        try {
          const pubKeysStorage = new KeystonePubKeysStorage()
          if (xpub && xpubXP && masterfingerprint) {
            await pubKeysStorage.save({
              evm: xpub,
              xp: xpubXP,
              mfp: masterfingerprint
            })
          }
          const pubKeys = await pubKeysStorage.retrieve()

          KeystoneWalletInstance.xpub = pubKeys.evm
          KeystoneWalletInstance.xpubXP = pubKeys.xp
          KeystoneWalletInstance.mfp = pubKeys.mfp
        } catch (error) {
          Logger.error(`Unable to save public keys`, error)
          throw new Error(`Unable to save public keys`)
        }
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
      case WalletType.KEYSTONE:
        KeystoneWalletInstance.xpub = undefined
        KeystoneWalletInstance.xpubXP = undefined
        KeystoneWalletInstance.mfp = undefined
        break
      default:
        throw new Error(
          `Unable to terminate wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletInitializer()
