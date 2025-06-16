import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import SeedlessService from 'seedless/services/SeedlessService'
import { Wallet, WalletType } from './types'

class WalletInitializer {
  async initialize({
    walletType,
    isLoggingIn
  }: {
    walletSecret?: string
    walletType: WalletType
    isLoggingIn: boolean
  }): Promise<Wallet> {
    if (walletType === WalletType.SEEDLESS) {
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
      // For SEEDLESS wallets, we return a placeholder or throw an error
      // since this initializer doesn't create the actual wallet instance
      throw new Error(
        'Seedless wallet initialization requires additional parameters'
      )
    } else {
      throw new Error(`Wallet type ${walletType} not supported`)
    }
  }
}

export default new WalletInitializer()
