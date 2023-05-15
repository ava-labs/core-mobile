import {
  Avalanche,
  BitcoinProviderAbstract,
  BitcoinWallet,
  DerivationPath,
  getAddressDerivationPath,
  getAddressFromXPub,
  getAddressPublicKeyFromXPub,
  getBech32AddressFromXPub,
  getWalletFromMnemonic,
  getXpubFromMnemonic
} from '@avalabs/wallets-sdk'
import { now } from 'moment'
import { PubKeyType, SignTransactionRequest } from 'services/wallet/types'
import { Wallet } from 'ethers'
import networkService from 'services/network/NetworkService'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { networks } from 'bitcoinjs-lib'
import {
  personalSign,
  signTypedData,
  SignTypedDataVersion
} from '@metamask/eth-sig-util'
import { getEvmProvider } from 'services/network/utils/providerUtils'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { Account } from 'store/account'
import { RpcMethod } from 'store/walletConnectV2/types'

class WalletService {
  private mnemonic?: string
  /**
   * Derivation path: m/44'/60'/0'
   * @private
   */
  private xpub?: string
  /**
   * Derivation path: m/44'/9000'/0'
   * @private
   */
  private xpubXP?: string

  async setMnemonic(mnemonic: string) {
    const xpubPromise = getXpubFromMnemonic(mnemonic)
    const xpubXPPromise = new Promise<string>(resolve => {
      resolve(Avalanche.getXpubFromMnemonic(mnemonic))
    })
    const pubKeys = await Promise.allSettled([xpubPromise, xpubXPPromise])
    if (pubKeys[0].status === 'fulfilled') {
      this.xpub = pubKeys[0].value
    }
    if (pubKeys[1].status === 'fulfilled') {
      this.xpubXP = pubKeys[1].value
    }
    this.mnemonic = mnemonic
  }

  async getBtcWallet(
    accountIndex: number,
    network: Network
  ): Promise<BitcoinWallet> {
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

  getEvmWallet(accountIndex: number, network: Network): Wallet {
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
  ): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.sign')
      .executeAsync(async () => {
        const wallet = await this.getWallet(accountIndex, network, sentryTrx)
        if (!wallet) {
          throw new Error('Signing error, wrong network')
        }

        // handle BTC signing
        if ('inputs' in tx) {
          if (!(wallet instanceof BitcoinWallet)) {
            throw new Error('Signing error, wrong network')
          }
          const signedTx = await wallet.signTx(tx.inputs, tx.outputs)
          return signedTx.toHex()
        }
        // Handle Avalanche signing, X/P/CoreEth
        if ('tx' in tx && wallet instanceof Avalanche.StaticSigner) {
          const sig = await wallet.signTxBuffer({
            buffer: tx.tx,
            chain: tx.chain
          })
          // Wallet can sign with multiple keys, but in our case it will always be one
          if (!sig[0]) throw new Error('Failed to sign transaction.')
          return sig[0].toString('hex')
        }
        if ('to' in tx) {
          return await (wallet as Wallet).signTransaction(tx)
        }
        throw new Error('Signing error, invalid data')
      })
  }

  async signMessage(
    rpcMethod: RpcMethod,
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

    if (data) {
      switch (rpcMethod) {
        case RpcMethod.ETH_SIGN:
        case RpcMethod.PERSONAL_SIGN:
          return personalSign({ privateKey: key, data })
        case RpcMethod.SIGN_TYPED_DATA:
        case RpcMethod.SIGN_TYPED_DATA_V1: {
          // instances were observed where method was eth_signTypedData or eth_signTypedData_v1,
          // however, payload was V4
          const isV4 =
            typeof data === 'object' && 'types' in data && 'primaryType' in data

          return signTypedData({
            privateKey: key,
            data,
            version: isV4 ? SignTypedDataVersion.V4 : SignTypedDataVersion.V1
          })
        }
        case RpcMethod.SIGN_TYPED_DATA_V3:
          return signTypedData({
            privateKey: key,
            data,
            version: SignTypedDataVersion.V3
          })
        case RpcMethod.SIGN_TYPED_DATA_V4:
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
    this.mnemonic = undefined
    this.xpub = undefined
    this.xpubXP = undefined
  }

  /**
   * Generates addresses with helpers from wallets-sdk
   * xpub is set at the time the mnemonic is set and is a derived 'read-only' key used for Ledger (not supported)
   * and to derive BTC, EVM addresses
   *
   * @param index
   * @param isTestnet
   */
  getAddress(index: number, isTestnet: boolean): Record<NetworkVMType, string> {
    if (!this.xpub) {
      throw new Error('No public key available')
    }

    // Avalanche XP Provider
    const provXP = networkService.getAvalancheProviderXP(isTestnet)

    // C-avax... this address uses the same public key as EVM
    const cPubKey = getAddressPublicKeyFromXPub(this.xpub, index)
    const cAddr = provXP.getAddress(cPubKey, 'C')

    let xAddr = '',
      pAddr = ''
    // We can only get X/P addresses if xpubXP is set
    if (this.xpubXP) {
      // X and P addresses different derivation path m/44'/9000'/0'...
      const xpPub = Avalanche.getAddressPublicKeyFromXpub(this.xpubXP, index)
      xAddr = provXP.getAddress(xpPub, 'X')
      pAddr = provXP.getAddress(xpPub, 'P')
    }
    return {
      [NetworkVMType.EVM]: getAddressFromXPub(this.xpub, index),
      [NetworkVMType.BITCOIN]: getBech32AddressFromXPub(
        this.xpub,
        index,
        isTestnet ? networks.testnet : networks.bitcoin
      ),
      [NetworkVMType.AVM]: xAddr,
      [NetworkVMType.PVM]: pAddr,
      [NetworkVMType.CoreEth]: cAddr
    }
  }

  private async getWallet(
    accountIndex: number,
    network: Network,
    sentryTrx?: Transaction
  ): Promise<Wallet | BitcoinWallet | Avalanche.StaticSigner | undefined> {
    const provider = networkService.getProviderForNetwork(network)
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.wallet.get_wallet')
      .executeAsync(async () => {
        switch (network.vmName) {
          case NetworkVMType.EVM:
            return this.getEvmWallet(accountIndex, network)
          case NetworkVMType.BITCOIN:
            return this.getBtcWallet(accountIndex, network)
          case NetworkVMType.AVM:
          case NetworkVMType.PVM:
            return Avalanche.StaticSigner.fromMnemonic(
              this.mnemonic ?? '',
              getAddressDerivationPath(
                accountIndex,
                DerivationPath.BIP44,
                'AVM'
              ),
              getAddressDerivationPath(
                accountIndex,
                DerivationPath.BIP44,
                'EVM'
              ),
              provider as Avalanche.JsonRpcProvider
            )
          default:
            return undefined
        }
      })
  }

  /**
   * Get the public key of an account
   * @throws Will throw error for LedgerLive accounts that have not been added yet.
   * @param account Account to get public key of.
   */
  async getPublicKey(account: Account): Promise<PubKeyType> {
    if (this.xpub && this.xpubXP) {
      const evmPub = getAddressPublicKeyFromXPub(this.xpub, account.index)
      const xpPub = Avalanche.getAddressPublicKeyFromXpub(
        this.xpubXP,
        account.index
      )
      return {
        evm: evmPub.toString('hex'),
        xp: xpPub.toString('hex')
      }
    } else {
      throw new Error('Can not find public key for the given index')
    }
  }
}

export default new WalletService()

function log(message?: unknown, ...optionalParams: unknown[]) {
  if (__DEV__) {
    console.log(message, ...optionalParams)
  }
}
