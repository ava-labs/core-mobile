import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import SecretsService from 'services/secrets/SecretsService'
import {
  EVM_BASE_DERIVATION_PATH_PREFIX,
  SecretType
} from 'services/secrets/types'
import { Wallet } from './types'
import MnemonicWallet from './MnemonicWallet'

class WalletFactory {
  async createWallet(walletId: string, accountIndex: number): Promise<Wallet> {
    const secrets = await SecretsService.getSecretsById(walletId)
    const publicKeys = secrets.publicKeys.filter(pubKey =>
      pubKey.derivationPath.startsWith(EVM_BASE_DERIVATION_PATH_PREFIX)
    )

    switch (secrets.secretType) {
      case SecretType.Seedless: {
        const addressPublicKey = publicKeys[accountIndex]

        if (!addressPublicKey) throw new Error('Public keys not available')
        const client = await SeedlessService.session.getSignerClient()

        return new SeedlessWallet(client, addressPublicKey)
      }
      case SecretType.Mnemonic:
        return new MnemonicWallet(secrets.mnemonic)
    }
  }
}

export default new WalletFactory()
