import {
  BitcoinWallet,
  getWalletFromMnemonic,
  JsonRpcBatchInternal
} from '@avalabs/wallets-sdk'
import { BitcoinProviderAbstract } from '@avalabs/wallets-sdk/src/BitcoinVM/providers/BitcoinProviderAbstract'
import { now } from 'moment'
import { SignTransactionRequest } from 'services/wallet/types'
import { Wallet } from 'ethers'
import networkService, { NetworkService } from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

export class WalletService {
  constructor(
    private networkService: NetworkService,
    private mnemonic: string
  ) {}

  setMnemonic(mnemonic: string) {
    this.mnemonic = mnemonic
  }

  async getBtcWallet(accountIndex: number, network: Network) {
    log('getBtcWallet', this.mnemonic)
    if (!this.mnemonic) {
      throw new Error('not initialized')
    }
    if (network.vmName !== NetworkVMType.BITCOIN) {
      throw new Error('Only Bitcoin networks supported')
    }
    const provider = this.networkService.getProviderForNetwork(network)

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
    log('evmWallet', now())
    const walletFromMnemonic = getWalletFromMnemonic(
      this.mnemonic,
      accountIndex
    )
    log('evmWallet getWalletFromMnemonic', now())
    walletFromMnemonic.connect(
      this.networkService.getProviderForNetwork(network) as JsonRpcBatchInternal
    )
    log('evmWallet end', now())
    return walletFromMnemonic
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

  // sendCustomTx(
  //   accountIndex: number,
  //   gasPrice: BN,
  //   gasLimit: number,
  //   data?: string | undefined,
  //   to?: string | undefined,
  //   value?: string | undefined,
  //   nonce?: number | undefined
  // ) {
  //   //TODO: will be changed to provider / signer pattern
  //   return this.getEvmWallet(accountIndex).sendCustomEvmTx(
  //     gasPrice,
  //     gasLimit,
  //     data,
  //     to,
  //     value,
  //     nonce
  //   )
  // }
}

export const walletServiceInstance = new WalletService(networkService, '')

function log(message?: any, ...optionalParams: any[]) {
  if (__DEV__) {
    console.log(message, ...optionalParams)
  }
}
