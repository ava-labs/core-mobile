import { CorePrimaryAccount } from '@avalabs/types'
import SecureStorageService, { KeySlot } from 'security/SecureStorageService'
import { Curve, PrimaryWalletSecrets, WalletSecretInStorage } from './types'
import { AddressPublicKey } from './AddressPublicKey'

/**
 * Use this service to fetch, save or delete account secrets.
 */
class SecretsService {
  #cachedSecrets: WalletSecretInStorage | null = null

  async update(secrets: PrimaryWalletSecrets): Promise<void> {
    this.#cachedSecrets = null
    const storedSecrets = await this.#loadSecrets(false)
    const wallets = storedSecrets?.wallets ?? []

    const idx = wallets.findIndex(w => w.id === secrets.id)

    if (idx !== -1) {
      const updatedWalletSecrets = wallets.map(wallet => {
        if (wallet.id === secrets.id) {
          return {
            ...wallet,
            ...secrets
          }
        }
        return { ...wallet }
      })

      await SecureStorageService.store(KeySlot.WalletSecrets, {
        ...storedSecrets,
        wallets: [...updatedWalletSecrets]
      })
    } else {
      wallets.push({
        ...secrets
      })

      await SecureStorageService.store(KeySlot.WalletSecrets, {
        ...storedSecrets,
        wallets
      })
    }
  }

  async getSecrets(account: CorePrimaryAccount): Promise<PrimaryWalletSecrets> {
    const { wallets } = await this.#loadSecrets(true)

    const secrets = wallets.find(wallet => wallet.id === account.walletId)

    if (!secrets) {
      throw new Error('There is no secrets for this account')
    }

    return secrets
  }

  async getSecretsById(
    secretId: string,
    wallets: PrimaryWalletSecrets[] = []
  ): Promise<PrimaryWalletSecrets> {
    const targetWallets =
      wallets.length > 0 ? wallets : (await this.#loadSecrets(true)).wallets

    const secrets = targetWallets.find(({ id }) => id === secretId)

    if (!secrets) {
      throw new Error('No secrets found for this id')
    }

    return secrets
  }

  async loadSecrets(): Promise<WalletSecretInStorage> {
    return await this.#loadSecrets(true)
  }

  async #loadSecrets(strict: true): Promise<WalletSecretInStorage | never>
  async #loadSecrets(strict: false): Promise<WalletSecretInStorage | null>
  async #loadSecrets(strict: boolean): Promise<WalletSecretInStorage | null> {
    if (this.#cachedSecrets) {
      return this.#cachedSecrets
    }

    try {
      const walletKeys = await SecureStorageService.load<WalletSecretInStorage>(
        KeySlot.WalletSecrets
      )

      if (!walletKeys && strict) {
        throw new Error('Wallet is not initialized')
      }

      this.#cachedSecrets = walletKeys ?? null
      return this.#cachedSecrets
    } catch (error) {
      if (strict) {
        throw new Error('Wallet is not initialized')
      }

      return null
    }
  }

  async derivePublicKey(
    secretId: string,
    curve: Curve,
    derivationPath?: string
  ): Promise<string> {
    const { wallets } = await this.#loadSecrets(true)
    const secrets = await this.getSecretsById(secretId, wallets)

    const pubkey = await AddressPublicKey.fromSecrets(
      secrets,
      curve,
      derivationPath
    )

    return pubkey.key
  }
}

export default new SecretsService()
