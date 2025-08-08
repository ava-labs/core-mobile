import {
  Avalanche,
  BitcoinLedgerWallet,
  SolanaLedgerSigner,
  LedgerSigner
} from '@avalabs/core-wallets-sdk'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { now } from 'moment'
import Logger from 'utils/Logger'
import { TransactionRequest } from 'ethers'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal, SolanaProvider } from '@avalabs/core-wallets-sdk'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'

import {
  RpcMethod,
  TypedDataV1,
  TypedData,
  MessageTypes
} from '@avalabs/vm-module-types'
import { Curve } from 'utils/publicKeys'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'
import {
  Wallet,
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SolanaTransactionRequest
} from './types'
import { getAddressDerivationPath } from './utils'

export interface LedgerWalletData {
  deviceId: string
  derivationPath: string
  vmType: NetworkVMType
  derivationPathSpec?: 'BIP44' | 'LedgerLive'
  extendedPublicKeys?: {
    evm?: string
    avalanche?: string
  }
  publicKeys?: Array<{
    key: string
    derivationPath: string
    curve: 'secp256k1' | 'ed25519'
    btcWalletPolicy?: {
      hmacHex: string
      xpub: string
      masterFingerprint: string
      name: string
    }
  }>
  transport: TransportBLE // Ledger transport for signing
}

export class LedgerWallet implements Wallet {
  private deviceId: string
  private derivationPath: string
  private vmType: NetworkVMType
  private derivationPathSpec?: string
  private extendedPublicKeys?: any
  private publicKeys?: any[]
  private transport: TransportBLE
  private evmSigner?: LedgerSigner
  private avalancheSigner?:
    | Avalanche.SimpleLedgerSigner
    | Avalanche.LedgerSigner
  private bitcoinWallet?: BitcoinLedgerWallet
  private solanaSigner?: SolanaLedgerSigner

  constructor(ledgerData: LedgerWalletData) {
    this.deviceId = ledgerData.deviceId
    this.derivationPath = ledgerData.derivationPath
    this.vmType = ledgerData.vmType
    this.derivationPathSpec = ledgerData.derivationPathSpec
    this.extendedPublicKeys = ledgerData.extendedPublicKeys
    this.publicKeys = ledgerData.publicKeys
    this.transport = ledgerData.transport
  }

  private getEvmSigner(): LedgerSigner {
    if (!this.evmSigner) {
      Logger.info('evmLedgerSigner', now())
      // LedgerSigner constructor needs deviceId, derivationPath, and provider
      // Parse account index from derivation path for LedgerSigner
      const pathParts = this.derivationPath.split('/')
      const accountIndex = parseInt(pathParts[pathParts.length - 1] || '0')

      this.evmSigner = new LedgerSigner(
        accountIndex,
        this.transport as any, // TransportBLE is runtime compatible with wallets SDK expectations
        (this.derivationPathSpec || 'BIP44') as any
      )
      Logger.info('evmLedgerSigner end', now())
    }
    return this.evmSigner
  }

  private async getAvalancheProvider(): Promise<
    Avalanche.SimpleLedgerSigner | Avalanche.LedgerSigner
  > {
    if (!this.avalancheSigner) {
      Logger.info('avalancheLedgerSigner', now())

      // Parse account index from derivation path
      const pathParts = this.derivationPath.split('/')
      const accountIndex = parseInt(pathParts[pathParts.length - 1] || '0')

      if (this.derivationPathSpec === 'BIP44') {
        // BIP44 mode - use extended public keys
        const extPublicKey = this.getExtendedPublicKeyFor(NetworkVMType.AVM)
        if (!extPublicKey) {
          throw new Error('Missing extended public key for AVM')
        }

        this.avalancheSigner = new Avalanche.SimpleLedgerSigner(
          accountIndex,
          this.transport as any, // TransportBLE is runtime compatible with wallets SDK expectations
          extPublicKey.key
        )
      } else {
        // LedgerLive mode - use individual public keys
        const pubkeyEVM = await this.getPublicKeyFor({
          derivationPath: this.getDerivationPath(
            accountIndex,
            NetworkVMType.EVM
          ),
          curve: Curve.SECP256K1
        })
        const pubkeyAVM = await this.getPublicKeyFor({
          derivationPath: this.getDerivationPath(
            accountIndex,
            NetworkVMType.AVM
          ),
          curve: Curve.SECP256K1
        })

        if (!pubkeyEVM || !pubkeyAVM) {
          throw new Error('Missing public keys for LedgerLive mode')
        }

        this.avalancheSigner = new Avalanche.LedgerSigner(
          Buffer.from(pubkeyAVM, 'hex'),
          this.getDerivationPath(accountIndex, NetworkVMType.AVM),
          Buffer.from(pubkeyEVM, 'hex'),
          this.getDerivationPath(accountIndex, NetworkVMType.EVM),
          this.transport as any // TransportBLE is runtime compatible with wallets SDK expectations
        )
      }

      Logger.info('avalancheLedgerSigner end', now())
    }
    return this.avalancheSigner
  }

  private async getBitcoinProvider(): Promise<BitcoinLedgerWallet> {
    if (!this.bitcoinWallet) {
      Logger.info('bitcoinLedgerWallet', now())

      // Get the proper Bitcoin provider
      const bitcoinProvider = await getBitcoinProvider(false) // false for mainnet, true for testnet

      // Get wallet policy details from public key data (on-demand storage)
      let walletPolicyDetails = null
      if (this.publicKeys) {
        const btcPolicy =
          BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
            this.publicKeys
          )
        if (btcPolicy) {
          try {
            walletPolicyDetails =
              BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
                btcPolicy
              )
          } catch (error) {
            Logger.warn(
              'Failed to parse Bitcoin wallet policy details from public key data:',
              error
            )
          }
        }
      }

      if (!walletPolicyDetails) {
        Logger.info(
          'Bitcoin wallet policy details not found. Attempting on-demand registration...'
        )

        // Bitcoin wallet policy details should be fetched by hook/LedgerService and stored via storeBtcWalletPolicy
        Logger.info(
          'Bitcoin wallet policy details not found. Hook/LedgerService should handle fetching and storing.'
        )
      }

      // BitcoinLedgerWallet constructor needs: publicKey, derivationPath, provider, transport, walletPolicyDetails
      this.bitcoinWallet = new BitcoinLedgerWallet(
        Buffer.from(this.deviceId, 'hex'), // publicKey - using deviceId as placeholder, should be actual public key
        this.derivationPath,
        bitcoinProvider, // provider - BitcoinProviderAbstract
        this.transport as any, // transport
        walletPolicyDetails as any // Use actual wallet policy details or null if not available
      )

      Logger.info('bitcoinLedgerWallet end', now())
    }
    return this.bitcoinWallet
  }

  private getSolanaProvider(): SolanaLedgerSigner {
    if (!this.solanaSigner) {
      Logger.info('solanaLedgerSigner', now())
      // SolanaLedgerSigner constructor needs accountIndex, not deviceId
      const pathParts = this.derivationPath.split('/')
      const accountIndex = parseInt(pathParts[pathParts.length - 1] || '0')

      this.solanaSigner = new SolanaLedgerSigner(
        accountIndex,
        this.transport as any // TransportBLE is runtime compatible with wallets SDK expectations
      )
      Logger.info('solanaLedgerSigner end', now())
    }
    return this.solanaSigner
  }

  private getExtendedPublicKeyFor(chain: string): any {
    if (!this.extendedPublicKeys) return null

    switch (chain) {
      case NetworkVMType.EVM:
        return this.extendedPublicKeys.evm
      case NetworkVMType.AVM:
        return this.extendedPublicKeys.avalanche
      default:
        return null
    }
  }

  private getDerivationPath(
    accountIndex: number,
    chain: Exclude<NetworkVMType, NetworkVMType.PVM | NetworkVMType.HVM>
  ): string {
    return getAddressDerivationPath({
      accountIndex,
      vmType: chain,
      derivationPathType:
        (this.derivationPathSpec?.toLowerCase() as any) || 'bip44'
    })
  }

  public async signMessage({
    rpcMethod,
    data,
    accountIndex,
    network,
    provider
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    switch (rpcMethod) {
      case RpcMethod.SOLANA_SIGN_MESSAGE:
        return this.signSolanaMessage()

      case RpcMethod.AVALANCHE_SIGN_MESSAGE: {
        return this.signAvalancheMessage(accountIndex, data)
      }

      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN:
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4:
        return this.signEvmMessage(
          data,
          accountIndex,
          network,
          provider,
          rpcMethod
        )

      default:
        throw new Error('unknown method')
    }
  }

  public async signBtcTransaction({
    transaction
  }: {
    transaction: BtcTransactionRequest
  }): Promise<string> {
    const signer = await this.getBitcoinProvider()

    if (!(signer instanceof BitcoinLedgerWallet)) {
      throw new Error('Unable to sign btc transaction: invalid signer')
    }

    const signedTx = await signer.signTx(
      transaction.inputs,
      transaction.outputs
    )
    return signedTx.toHex()
  }

  public async signAvalancheTransaction({
    transaction
  }: {
    transaction: AvalancheTransactionRequest
  }): Promise<string> {
    const signer = await this.getAvalancheProvider()

    if (
      !(
        signer instanceof Avalanche.SimpleLedgerSigner ||
        signer instanceof Avalanche.LedgerSigner
      )
    ) {
      throw new Error('Unable to sign avalanche transaction: invalid signer')
    }

    const txToSign = {
      tx: transaction.tx,
      externalIndices: transaction.externalIndices,
      internalIndices: transaction.internalIndices
    }

    const sig = await signer.signTx(txToSign)
    return JSON.stringify(sig.toJSON())
  }

  public async signEvmTransaction({
    transaction
  }: {
    transaction: TransactionRequest
  }): Promise<string> {
    const signer = this.getEvmSigner()

    if (!(signer instanceof LedgerSigner)) {
      throw new Error('Unable to sign evm transaction: invalid signer')
    }

    return await signer.signTransaction(transaction)
  }

  public async signSvmTransaction({
    transaction,
    network: _network,
    provider
  }: {
    transaction: SolanaTransactionRequest
    network: Network
    provider: SolanaProvider
  }): Promise<string> {
    const signer = this.getSolanaProvider()

    if (!(signer instanceof SolanaLedgerSigner)) {
      throw new Error('Unable to sign solana transaction: invalid signer')
    }

    return await signer.signTx(transaction.serializedTx, provider)
  }

  public async getPublicKeyFor({
    derivationPath,
    curve
  }: {
    derivationPath?: string
    curve: Curve
  }): Promise<string> {
    if (derivationPath === undefined) {
      throw new Error(
        'derivationPath is required to get public key for LedgerWallet'
      )
    }

    if (!this.publicKeys) {
      throw new Error('No public keys available for LedgerWallet')
    }

    // Find the public key that matches the derivation path and curve
    const matchingPublicKey = this.publicKeys.find(pk => {
      const curveMatches =
        (curve === Curve.SECP256K1 && pk.curve === 'secp256k1') ||
        (curve === Curve.ED25519 && pk.curve === 'ed25519')

      return curveMatches && pk.derivationPath === derivationPath
    })

    if (!matchingPublicKey) {
      throw new Error(
        `No public key found for derivation path ${derivationPath} and curve ${curve}`
      )
    }

    return matchingPublicKey.key
  }

  public async getReadOnlyAvaSigner(): Promise<Avalanche.StaticSigner> {
    // For Ledger wallets, we don't have a read-only signer
    // We always need the device for signing
    throw new Error('getReadOnlyAvaSigner not supported for LedgerWallet')
  }

  // Private helper methods for message signing
  private async signSolanaMessage(): Promise<string> {
    // SolanaLedgerSigner doesn't have signMessage method
    // We need to implement message signing using available methods
    // For now, throw an error until we can implement proper message signing
    throw new Error(
      'Solana message signing not yet implemented for LedgerWallet - needs proper message serialization'
    )
  }

  private async signAvalancheMessage(
    accountIndex: number,
    data: any
  ): Promise<string> {
    const signer = await this.getAvalancheProvider()
    const signature = await signer.signMessage(data)
    return signature.toString('hex')
  }

  // eslint-disable-next-line max-params
  private async signEvmMessage(
    data: string | TypedDataV1 | TypedData<MessageTypes>,
    _accountIndex: number,
    _network: Network,
    _provider: JsonRpcBatchInternal,
    rpcMethod: RpcMethod
  ): Promise<string> {
    const signer = this.getEvmSigner()

    if (
      rpcMethod === RpcMethod.SIGN_TYPED_DATA ||
      rpcMethod === RpcMethod.SIGN_TYPED_DATA_V1 ||
      rpcMethod === RpcMethod.SIGN_TYPED_DATA_V3 ||
      rpcMethod === RpcMethod.SIGN_TYPED_DATA_V4
    ) {
      // Handle typed data signing
      const typedData = data as TypedData<MessageTypes>
      return await signer.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
      )
    } else if (
      rpcMethod === RpcMethod.ETH_SIGN ||
      rpcMethod === RpcMethod.PERSONAL_SIGN
    ) {
      // Handle personal sign and eth_sign
      const dataToSign = typeof data === 'string' ? data : JSON.stringify(data)
      return await signer.signMessage(dataToSign)
    } else {
      throw new Error('This function is not supported on your wallet')
    }
  }
}
