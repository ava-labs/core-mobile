import {
  BitcoinWallet,
  DerivationPath,
  getAddressFromXPub,
  getBech32AddressFromXPub,
  getWalletFromMnemonic,
  getXpubFromMnemonic
} from '@avalabs/wallets-sdk'
import { BitcoinProviderAbstract } from '@avalabs/wallets-sdk/src/BitcoinVM/providers/BitcoinProviderAbstract'
import { now } from 'moment'
import { SignTransactionRequest } from 'services/wallet/types'
import { Wallet } from 'ethers'
import networkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { networks } from 'bitcoinjs-lib'
import { MessageType } from 'services/walletconnect/types'
import {
  personalSign,
  signTypedData,
  SignTypedDataVersion
} from '@metamask/eth-sig-util'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import BN from 'bn.js'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'

class WalletService {
  private mnemonic?: string
  private xpub?: string

  async setMnemonic(mnemonic: string) {
    this.mnemonic = mnemonic
    this.xpub = await getXpubFromMnemonic(mnemonic)
  }

  async getBtcWallet(accountIndex: number, network: Network) {
    if (!this.mnemonic) {
      throw new Error('not initialized')
    }
    if (network.vmName !== NetworkVMType.BITCOIN) {
      throw new Error('Only Bitcoin networks supported')
    }
    const provider = networkService.getProviderForNetwork(network)

    log('btcWallet', now())
    const btcWallet = await BitcoinWallet.fromMnemonic(
      this.mnemonic,
      accountIndex,
      provider as BitcoinProviderAbstract
    )
    log('btcWallet end', now())
    return btcWallet
  }

  getEvmWallet(accountIndex: number, network: Network) {
    if (!this.mnemonic) {
      throw new Error('not initialized')
    }
    if (network.vmName !== NetworkVMType.EVM) {
      throw new Error('Only EVM networks supported')
    }
    const start = now()
    log('evmWallet', now() - start)
    const walletFromMnemonic = getWalletFromMnemonic(
      this.mnemonic,
      accountIndex,
      DerivationPath.BIP44
    )

    log('evmWallet getWalletFromMnemonic', now() - start)
    const connectedWallet = walletFromMnemonic.connect(getEvmProvider(network))
    log('evmWallet end', now() - start)

    return connectedWallet
  }

  async sign(
    tx: SignTransactionRequest,
    accountIndex: number,
    network: Network,
    sentryTrx?: Transaction
  ) {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext({ op: 'sign' })
      .executeAsync(async () => {
        const wallet = await this.getWallet(accountIndex, network, sentryTrx)

        // handle BTC signing
        if ('inputs' in tx) {
          if (!(wallet instanceof BitcoinWallet)) {
            throw new Error('Signing error, wrong network')
          }
          const signedTx = await wallet.signTx(tx.inputs, tx.outputs)
          return signedTx.toHex()
        } else {
          // if (!(wallet instanceof Wallet)) {
          //   throw new Error('Signing error, wrong network')
          // }

          return await (wallet as Wallet).signTransaction(tx)
        }
      })
  }

  async signMessage(
    messageType: MessageType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    accountIndex: number,
    network: Network
  ) {
    const wallet = await this.getWallet(accountIndex, network)
    if (!wallet || !(wallet instanceof Wallet)) {
      throw new Error(
        wallet
          ? `this function not supported on your wallet`
          : 'wallet undefined in sign tx'
      )
    }

    const privateKey = wallet.privateKey.toLowerCase().startsWith('0x')
      ? wallet.privateKey.slice(2)
      : wallet.privateKey

    const key = Buffer.from(privateKey, 'hex')

    // instances were observed where SignTypeData version was not specified,
    // however, payload was V4
    const isV4 =
      typeof data === 'object' && 'types' in data && 'primaryType' in data

    if (data) {
      switch (messageType) {
        case MessageType.ETH_SIGN:
        case MessageType.PERSONAL_SIGN:
          return personalSign({ privateKey: key, data })
        case MessageType.SIGN_TYPED_DATA:
        case MessageType.SIGN_TYPED_DATA_V1: {
          return signTypedData({
            privateKey: key,
            data,
            version: isV4 ? SignTypedDataVersion.V4 : SignTypedDataVersion.V1
          })
        }
        case MessageType.SIGN_TYPED_DATA_V3:
          return signTypedData({
            privateKey: key,
            data,
            version: SignTypedDataVersion.V3
          })
        case MessageType.SIGN_TYPED_DATA_V4:
          return signTypedData({
            privateKey: key,
            data,
            version: SignTypedDataVersion.V4
          })
        default:
          throw new Error('unknown method')
      }
    } else {
      throw new Error('no message to sign')
    }
  }

  destroy() {
    this.mnemonic = ''
  }

  /**
   * Generates addresses with helpers from wallets-sdk
   * xpub is set at the time the nmemonic is set and is a derived 'read-only' key used for Ledger (not supported)
   * and to derive BTC, EVM addresses
   *
   * @param index
   * @param isTestnet
   */
  getAddress(index: number, isTestnet: boolean): Record<NetworkVMType, string> {
    if (!this.xpub) {
      throw new Error('no xpub generated')
    }

    return {
      [NetworkVMType.EVM]: getAddressFromXPub(this.xpub, index),
      [NetworkVMType.BITCOIN]: getBech32AddressFromXPub(
        this.xpub,
        index,
        isTestnet ? networks.testnet : networks.bitcoin
      )
    }
  }

  private async getWallet(
    accountIndex: number,
    network: Network,
    sentryTrx?: Transaction
  ) {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext({ op: 'getWallet' })
      .executeAsync(async () => {
        switch (network.vmName) {
          case NetworkVMType.EVM:
            return this.getEvmWallet(accountIndex, network)
          case NetworkVMType.BITCOIN:
            return await this.getBtcWallet(accountIndex, network)
          default:
            return undefined
        }
      })
  }

  //fixme - remove and use network.send
  sendCustomTx(
    gasPrice: BN,
    gasLimit: number,
    data?: string | undefined,
    to?: string | undefined,
    value?: string | undefined,
    nonce?: number | undefined
  ): [string, Error | undefined] {
    gasPrice
    gasLimit
    data
    to
    value
    nonce
    return ['', undefined]
  }
}

export default new WalletService()

function log(message?: unknown, ...optionalParams: unknown[]) {
  if (__DEV__) {
    console.log(message, ...optionalParams)
  }
}
