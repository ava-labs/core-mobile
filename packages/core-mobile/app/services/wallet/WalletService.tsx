import {
  Avalanche,
  BitcoinProvider,
  isSolanaProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  PubKeyType,
  SignTransactionRequest,
  WalletType
} from 'services/wallet/types'
import NetworkService from 'services/network/NetworkService'
import { Network } from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import Logger from 'utils/Logger'
import {
  MessageTypes,
  NetworkVMType,
  RpcMethod,
  TypedData,
  TypedDataV1
} from '@avalabs/vm-module-types'
import { SpanName } from 'services/sentry/types'
import { Curve } from 'utils/publicKeys'

import { profileApi } from 'utils/apiClient/profile/profileApi'
import { GetAddressesResponse } from 'utils/apiClient/profile/types'
import {
  getAddressDerivationPath,
  isAvalancheTransactionRequest,
  isBtcTransactionRequest,
  isSolanaTransactionRequest
} from './utils'
import WalletFactory from './WalletFactory'
import { MnemonicWallet } from './MnemonicWallet'
import KeystoneWallet from './KeystoneWallet'
import { LedgerWallet } from './LedgerWallet'

class WalletService {
  public async sign({
    walletId,
    walletType,
    transaction,
    accountIndex,
    network,
    sentrySpanName = 'sign-transaction'
  }: {
    walletId: string
    walletType: WalletType
    transaction: SignTransactionRequest
    accountIndex: number
    network: Network
    sentrySpanName?: SpanName
  }): Promise<string> {
    return SentryWrapper.startSpan(
      { name: sentrySpanName, contextName: 'svc.wallet.sign' },
      async () => {
        const provider = await NetworkService.getProviderForNetwork(network)
        const wallet = await WalletFactory.createWallet({
          walletId,
          walletType
        })

        if (isBtcTransactionRequest(transaction)) {
          if (!(provider instanceof BitcoinProvider))
            throw new Error(
              'Unable to sign btc transaction: wrong provider obtained'
            )

          return wallet.signBtcTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (isAvalancheTransactionRequest(transaction)) {
          if (!(provider instanceof Avalanche.JsonRpcProvider))
            throw new Error(
              'Unable to sign avalanche transaction: wrong provider obtained'
            )

          return wallet.signAvalancheTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (isSolanaTransactionRequest(transaction)) {
          if (!isSolanaProvider(provider))
            throw new Error(
              'Unable to sign solana transaction: wrong provider obtained'
            )

          return wallet.signSvmTransaction({
            accountIndex,
            transaction,
            network,
            provider
          })
        }

        if (!(provider instanceof JsonRpcBatchInternal))
          throw new Error(
            'Unable to sign evm transaction: wrong provider obtained'
          )

        return wallet.signEvmTransaction({
          accountIndex,
          transaction,
          network,
          provider
        })
      }
    )
  }

  public async signMessage({
    walletId,
    walletType,
    rpcMethod,
    data,
    accountIndex,
    network
  }: {
    walletId: string
    walletType: WalletType
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
  }): Promise<string> {
    const provider = await NetworkService.getProviderForNetwork(network)

    if (
      !(provider instanceof JsonRpcBatchInternal) &&
      !(provider instanceof Avalanche.JsonRpcProvider) &&
      !isSolanaProvider(provider)
    )
      throw new Error('Unable to sign message: wrong provider obtained')

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    return wallet.signMessage({
      rpcMethod,
      data,
      accountIndex,
      network,
      provider
    })
  }

  //FIXME: call terminate for seedless
  // public async destroy(): Promise<void> {
  //   await WalletInitializer.terminate(this.walletType).catch(e =>
  //     Logger.error('unable to destroy wallet', e)
  //   )
  //   this.walletType = WalletType.UNSET
  // }

  /**
   * Get the public key of an account
   * @param account Account to get public key of.
   */
  public async getPublicKey(
    walletId: string,
    walletType: WalletType,
    accountIndex: number
  ): Promise<PubKeyType> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    const derivationPathEVM = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.EVM
    })
    const derivationPathAVM = getAddressDerivationPath({
      accountIndex,
      vmType: NetworkVMType.AVM
    })

    const evmPublicKey = await wallet.getPublicKeyFor({
      derivationPath: derivationPathEVM,
      curve: Curve.SECP256K1
    })

    const xpPublicKey = await wallet.getPublicKeyFor({
      derivationPath: derivationPathAVM,
      curve: Curve.SECP256K1
    })

    return {
      evm: evmPublicKey,
      xp: xpPublicKey
    }
  }

  public async getPublicKeyFor({
    walletId,
    walletType,
    derivationPath,
    curve
  }: {
    walletId: string
    walletType: WalletType
    derivationPath?: string
    curve: Curve
  }): Promise<string> {
    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    return await wallet.getPublicKeyFor({ derivationPath, curve })
  }

  public async getRawXpubXP({
    walletId,
    walletType,
    accountIndex
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
  }): Promise<string> {
    if (!this.hasXpub(walletType)) {
      throw new Error('Unable to get raw xpub XP: unsupported wallet type')
    }

    const wallet = await WalletFactory.createWallet({
      walletId,
      walletType
    })

    if (
      !(wallet instanceof MnemonicWallet) &&
      !(wallet instanceof KeystoneWallet) &&
      !(wallet instanceof LedgerWallet)
    ) {
      throw new Error(
        'Unable to get raw xpub XP: Expected MnemonicWallet, KeystoneWallet or LedgerWallet instance'
      )
    }

    return wallet.getRawXpubXP(accountIndex)
  }

  // TODO pass correct account index after
  // https://github.com/ava-labs/avalanche-sdks/pull/765/files is merged
  public async getAddressesFromXpubXP({
    walletId,
    walletType,
    accountIndex,
    networkType,
    isTestnet = false,
    onlyWithActivity
  }: {
    walletId: string
    walletType: WalletType
    accountIndex: number
    networkType: NetworkVMType.AVM | NetworkVMType.PVM
    isTestnet: boolean
    onlyWithActivity: boolean
  }): Promise<GetAddressesResponse> {
    const xpubXP = await this.getRawXpubXP({
      walletId,
      walletType,
      accountIndex
    })

    try {
      return await profileApi.postV1getAddresses({
        networkType: networkType,
        extendedPublicKey: xpubXP,
        isTestnet,
        onlyWithActivity
      })
    } catch (err) {
      Logger.error(`[WalletService.ts][getAddressesFromXpubXP]${err}`)
      throw err
    }
  }

  public async getPrivateKeyFromMnemonic(
    mnemonic: string,
    network: Network,
    accountIndex: number
  ): Promise<string> {
    const wallet: MnemonicWallet = new MnemonicWallet(mnemonic)
    const provider = await NetworkService.getProviderForNetwork(network)
    if (!(provider instanceof JsonRpcBatchInternal)) {
      throw new Error('Unable to get signing key: wrong provider obtained')
    }
    const buffer = await wallet.getSigningKey({
      accountIndex,
      network,
      provider
    })
    return '0x' + buffer.toString('hex')
  }

  public hasXpub(walletType: WalletType): boolean {
    return [
      WalletType.MNEMONIC,
      WalletType.KEYSTONE,
      WalletType.LEDGER
    ].includes(walletType)
  }
}

// Keep as singleton
export default new WalletService()
