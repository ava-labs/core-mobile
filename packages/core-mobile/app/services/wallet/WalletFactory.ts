import { KeystoneDataStorage } from 'features/keystone/storage/KeystoneDataStorage'
import { LedgerWalletData } from 'services/ledger/types'
import { migrateLegacyLedgerExtendedKeys } from 'services/ledger/migrateLegacyLedgerExtendedKeys'
import KeystoneWallet from 'services/wallet/KeystoneWallet'
import { PrivateKeyWallet } from 'services/wallet/PrivateKeyWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import { SeedlessPubKeysStorage } from 'seedless/services/storage/SeedlessPubKeysStorage'
import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import BiometricsSDK from 'utils/BiometricsSDK'
import { LedgerWallet } from './LedgerWallet'
import { MnemonicWallet } from './MnemonicWallet'
import { Wallet, WalletType } from './types'

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
        let pubKeys = await SeedlessPubKeysStorage.retrieve()

        if (pubKeys.length === 0) {
          // If no public keys are available, refresh them
          // This can happen if the app was updated from a version that stored with a different key
          await SeedlessService.refreshPublicKeys()
          pubKeys = await SeedlessPubKeysStorage.retrieve()
        }

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
      case WalletType.KEYSTONE: {
        const keystoneData = await KeystoneDataStorage.retrieve()

        if (!keystoneData) {
          throw new Error('Keystone data not available')
        }

        return new KeystoneWallet(keystoneData)
      }
      case WalletType.PRIVATE_KEY: {
        const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
        if (!walletSecret.success) {
          throw new Error('Failed to load wallet secret')
        }
        return new PrivateKeyWallet(walletSecret.value)
      }
      case WalletType.LEDGER:
      case WalletType.LEDGER_LIVE: {
        const walletSecret = await BiometricsSDK.loadWalletSecret(walletId)
        if (!walletSecret.success) {
          throw new Error('Failed to load wallet secret')
        }

        const ledgerData: LedgerWalletData = JSON.parse(walletSecret.value)

        await migrateLegacyLedgerExtendedKeys({ ledgerData, walletId })

        return new LedgerWallet(ledgerData)
      }
      default:
        throw new Error(
          `Unable to create wallet: unsupported wallet type ${walletType}`
        )
    }
  }
}

export default new WalletFactory()
