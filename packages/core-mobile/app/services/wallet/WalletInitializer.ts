import Logger from 'utils/Logger'
import { transformKeyInfosToPubKeys } from 'seedless/services/wallet/transformKeyInfosToPubkeys'
import {
  Avalanche,
  DerivationPath,
  getXpubFromMnemonic
} from '@avalabs/core-wallets-sdk'
import SeedlessService from 'seedless/services/SeedlessService'
import SecretsService from 'services/secrets/SecretsService'
import {
  AVALANCHE_BASE_DERIVATION_PATH,
  EVM_BASE_DERIVATION_PATH,
  SecretType
} from 'services/secrets/types'
import { buildExtendedPublicKey } from 'services/secrets/utils'
import { CORE_MOBILE_WALLET_ID } from 'services/walletconnectv2/types'
import { WalletType } from './types'

class WalletInitializer {
  async initialize({
    mnemonic,
    walletType,
    shouldUpdatePubkeys
  }: {
    mnemonic?: string
    walletType: WalletType
    shouldUpdatePubkeys: boolean
  }): Promise<void> {
    switch (walletType) {
      case WalletType.SEEDLESS: {
        try {
          if (shouldUpdatePubkeys) {
            const allKeys = await SeedlessService.getSessionKeysList()
            const pubKeys = await transformKeyInfosToPubKeys(allKeys)
            Logger.info('saving public keys')

            await SecretsService.update({
              id: CORE_MOBILE_WALLET_ID,
              secretType: SecretType.Seedless,
              publicKeys: pubKeys,
              derivationPathSpec: DerivationPath.BIP44
            })
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
        if (pubKeys[0].status !== 'fulfilled') {
          throw new Error(`getXpubFromMnemonic failed, ${pubKeys[0].reason}`)
        }
        if (pubKeys[1].status !== 'fulfilled') {
          throw new Error(
            `Avalanche.getXpubFromMnemonic failed, ${pubKeys[1].reason}`
          )
        }

        const evmXpub = pubKeys[0].value
        const avaxXpub = pubKeys[1].value

        await SecretsService.update({
          id: CORE_MOBILE_WALLET_ID,
          secretType: SecretType.Mnemonic,
          mnemonic,
          extendedPublicKeys: [
            buildExtendedPublicKey(evmXpub, EVM_BASE_DERIVATION_PATH),
            buildExtendedPublicKey(avaxXpub, AVALANCHE_BASE_DERIVATION_PATH)
          ],
          publicKeys: [],
          derivationPathSpec: DerivationPath.BIP44
        })

        break
      }
      default:
        throw new Error(`Wallet type ${walletType} not supported`)
    }
  }
}

export default new WalletInitializer()
