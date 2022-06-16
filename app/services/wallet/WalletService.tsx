import {
  BitcoinWallet,
  getAddressFromXPub,
  getBech32AddressFromXPub,
  getWalletFromMnemonic,
  getXpubFromMnemonic,
  JsonRpcBatchInternal
} from '@avalabs/wallets-sdk'
import { BitcoinProviderAbstract } from '@avalabs/wallets-sdk/src/BitcoinVM/providers/BitcoinProviderAbstract'
import { now } from 'moment'
import { SignTransactionRequest } from 'services/wallet/types'
import { Wallet } from 'ethers'
import networkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { BN } from 'avalanche'
import { networks } from 'bitcoinjs-lib'

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
      accountIndex
    )
    log('evmWallet getWalletFromMnemonic', now() - start)
    const connectedWallet = walletFromMnemonic.connect(
      networkService.getProviderForNetwork(network) as JsonRpcBatchInternal
    )
    log('evmWallet end', now() - start)
    return connectedWallet
  }

  async sign(
    tx: SignTransactionRequest,
    accountIndex: number,
    network: Network
  ) {
    const wallet = await this.getWallet(accountIndex, network)

    // handle BTC signing
    if ('inputs' in tx) {
      if (!(wallet instanceof BitcoinWallet)) {
        throw new Error('Signing error, wrong network')
      }
      const signedTx = await wallet.signTx(tx.inputs, tx.outputs)
      return signedTx.toHex()
    } else {
      if (!(wallet instanceof Wallet)) {
        throw new Error('Signing error, wrong network')
      }
      return await wallet.signTransaction(tx)
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
   * @param isMainnet
   */
  getAddress(index: number, isMainnet: boolean): Record<NetworkVMType, string> {
    if (!this.xpub) {
      throw new Error('no xpub generated')
    }

    return {
      [NetworkVMType.EVM]: getAddressFromXPub(this.xpub, index),
      [NetworkVMType.BITCOIN]: getBech32AddressFromXPub(
        this.xpub,
        index,
        isMainnet ? networks.bitcoin : networks.testnet
      )
    }
  }

  private async getWallet(accountIndex: number, network: Network) {
    switch (network.vmName) {
      case NetworkVMType.EVM:
        return this.getEvmWallet(accountIndex, network)
      case NetworkVMType.BITCOIN:
        return await this.getBtcWallet(accountIndex, network)
      default:
        return undefined
    }
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

function log(message?: any, ...optionalParams: any[]) {
  if (__DEV__) {
    console.log(message, ...optionalParams)
  }
}
