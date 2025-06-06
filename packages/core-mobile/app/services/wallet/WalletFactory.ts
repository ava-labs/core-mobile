import SeedlessWallet from 'seedless/services/wallet/SeedlessWallet'
import SeedlessService from 'seedless/services/SeedlessService'
import SecretsService from 'services/secrets/SecretsService'
import { SecretType } from 'services/secrets/types'
import { Wallet } from './types'
import MnemonicWallet from './MnemonicWallet'

class WalletFactory {
  async createWallet(walletId: string): Promise<Wallet> {
    const secrets = await SecretsService.getSecretsById(walletId)
    switch (secrets.secretType) {
      case SecretType.Seedless: {
        const addressPublicKey = secrets.publicKeys[0]

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
