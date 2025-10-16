import {
  Avalanche,
  BitcoinLedgerWallet,
  LedgerSigner,
  BitcoinProvider,
  deserializeTransactionMessage,
  compileSolanaTx,
  serializeSolanaTx,
  getEvmAddressFromPubKey,
  getBtcAddressFromPubKey
} from '@avalabs/core-wallets-sdk'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal, SolanaProvider } from '@avalabs/core-wallets-sdk'
import {
  RpcMethod,
  TypedDataV1,
  TypedData,
  MessageTypes
} from '@avalabs/vm-module-types'
import AppAvax from '@avalabs/hw-app-avalanche'
import AppSolana from '@ledgerhq/hw-app-solana'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import Transport from '@ledgerhq/hw-transport'
import { networks } from 'bitcoinjs-lib'
import bs58 from 'bs58'
import { TransactionRequest } from 'ethers'
import { now } from 'moment'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import LedgerService from 'services/ledger/LedgerService'
import {
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerWalletData
} from 'services/ledger/types'
import {
  LEDGER_TIMEOUTS,
  getSolanaDerivationPath
} from 'new/features/ledger/consts'
import { bip32 } from 'utils/bip32'
import Logger from 'utils/Logger'
import { Curve } from 'utils/publicKeys'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'
import {
  Wallet,
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SolanaTransactionRequest
} from './types'
import { getAddressDerivationPath } from './utils'

// Types are now imported from services/ledger/types

export class LedgerWallet implements Wallet {
  private deviceId: string
  private derivationPath: string
  private derivationPathSpec: LedgerDerivationPathType
  private extendedPublicKeys?: { evm: string; avalanche: string }
  private publicKeys: Array<{
    key: string
    derivationPath: string
    curve: Curve
    btcWalletPolicy?: {
      hmacHex: string
      xpub: string
      masterFingerprint: string
      name: string
    }
  }>
  private evmSigner?: LedgerSigner
  private avalancheSigner?:
    | Avalanche.SimpleLedgerSigner
    | Avalanche.LedgerSigner
  private bitcoinWallet?: BitcoinLedgerWallet

  constructor(ledgerData: LedgerWalletData) {
    this.deviceId = ledgerData.deviceId
    this.derivationPath = ledgerData.derivationPath
    this.derivationPathSpec = ledgerData.derivationPathSpec
    this.publicKeys = ledgerData.publicKeys

    /**
     * Handle extended keys based on derivation path type
     * For Ledger Live, extendedPublicKeys remains undefined
     */
    if (ledgerData.derivationPathSpec === LedgerDerivationPathType.BIP44) {
      this.extendedPublicKeys = ledgerData.extendedPublicKeys
    }
  }

  private async getTransport(): Promise<TransportBLE> {
    Logger.info('getTransport called - using LedgerService')
    return LedgerService.ensureConnection(this.deviceId)
  }

  private async getEvmSigner(
    provider?: JsonRpcBatchInternal,
    accountIndex?: number
  ): Promise<LedgerSigner> {
    // Use provided accountIndex or fallback to parsing from stored derivationPath
    const targetAccountIndex =
      accountIndex ?? parseInt(this.derivationPath.split('/').pop() || '0')

    if (!this.evmSigner || accountIndex !== undefined) {
      Logger.info('evmLedgerSigner', now())

      Logger.info('getEvmSigner', {
        provider,
        transport: this.getTransport(),
        derivationPath: this.derivationPath,
        derivationPathSpec: this.derivationPathSpec,
        accountIndex,
        targetAccountIndex
      })

      try {
        const transport = await this.getTransport()

        // Create LedgerSigner with the correct signature from SDK:
        // constructor(accountIndex, transport, derivationSpec, provider?)
        this.evmSigner = new LedgerSigner(
          targetAccountIndex,
          transport as Transport,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.derivationPathSpec || 'BIP44') as any,
          provider
        )

        Logger.info('LedgerSigner created successfully')
        Logger.info('evmLedgerSigner end', now())
      } catch (error) {
        Logger.error('Failed to create LedgerSigner:', error)
        throw new Error(`Failed to create LedgerSigner: ${error}`)
      }
    }
    return this.evmSigner
  }

  private async getAvalancheProvider(
    accountIndex?: number
  ): Promise<Avalanche.SimpleLedgerSigner | Avalanche.LedgerSigner> {
    // Use provided accountIndex or fallback to parsing from stored derivationPath
    const targetAccountIndex =
      accountIndex ?? parseInt(this.derivationPath.split('/').pop() || '0')

    if (!this.avalancheSigner || accountIndex !== undefined) {
      Logger.info('avalancheLedgerSigner', now())

      const transport = await this.getTransport()

      if (this.derivationPathSpec === LedgerDerivationPathType.BIP44) {
        // BIP44 mode - use extended public keys
        const extPublicKey = this.getExtendedPublicKeyFor(NetworkVMType.AVM)
        if (!extPublicKey) {
          throw new Error('Missing extended public key for AVM')
        }

        this.avalancheSigner = new Avalanche.SimpleLedgerSigner(
          targetAccountIndex,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transport as any, // TransportBLE is runtime compatible with wallets SDK expectations
          extPublicKey.key
        )
      } else {
        // LedgerLive mode - use individual public keys
        const pubkeyEVM = await this.getPublicKeyFor({
          derivationPath: this.getDerivationPath(
            targetAccountIndex,
            NetworkVMType.EVM
          ),
          curve: Curve.SECP256K1
        })
        const pubkeyAVM = await this.getPublicKeyFor({
          derivationPath: this.getDerivationPath(
            targetAccountIndex,
            NetworkVMType.AVM
          ),
          curve: Curve.SECP256K1
        })

        if (!pubkeyEVM || !pubkeyAVM) {
          throw new Error('Missing public keys for LedgerLive mode')
        }

        this.avalancheSigner = new Avalanche.LedgerSigner(
          Buffer.from(pubkeyAVM, 'hex'),
          this.getDerivationPath(targetAccountIndex, NetworkVMType.AVM),
          Buffer.from(pubkeyEVM, 'hex'),
          this.getDerivationPath(targetAccountIndex, NetworkVMType.EVM),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transport as any // TransportBLE is runtime compatible with wallets SDK expectations
        )
      }

      Logger.info('avalancheLedgerSigner end', now())
    }
    return this.avalancheSigner
  }

  private async getBitcoinProvider(
    isTestnet = false
  ): Promise<BitcoinLedgerWallet> {
    if (!this.bitcoinWallet) {
      Logger.info('bitcoinLedgerWallet', now())

      // Get the proper Bitcoin provider using provided network context
      const bitcoinProvider = await getBitcoinProvider(isTestnet)

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

      const transport = await this.getTransport()

      // BitcoinLedgerWallet constructor needs: publicKey, derivationPath, provider, transport, walletPolicyDetails
      this.bitcoinWallet = new BitcoinLedgerWallet(
        Buffer.from(this.deviceId, 'hex'), // publicKey - using deviceId as placeholder, should be actual public key
        this.derivationPath,
        bitcoinProvider, // provider - BitcoinProviderAbstract
        transport as Transport, // transport
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        walletPolicyDetails as any // Use actual wallet policy details or null if not available
      )

      Logger.info('bitcoinLedgerWallet end', now())
    }
    return this.bitcoinWallet
  }

  private getDerivationPath(
    accountIndex: number,
    chain: Exclude<NetworkVMType, NetworkVMType.PVM | NetworkVMType.HVM>
  ): string {
    // Convert our enum to the expected derivation path type
    const derivationPathType =
      this.derivationPathSpec === LedgerDerivationPathType.LedgerLive
        ? 'ledger_live'
        : 'bip44'

    return getAddressDerivationPath({
      accountIndex,
      vmType: chain,
      derivationPathType
    })
  }

  /**
   * Check if this wallet uses BIP44 derivation
   */
  public isBIP44(): boolean {
    return this.derivationPathSpec === LedgerDerivationPathType.BIP44
  }

  /**
   * Check if this wallet uses Ledger Live derivation
   */
  public isLedgerLive(): boolean {
    return this.derivationPathSpec === LedgerDerivationPathType.LedgerLive
  }

  /**
   * Get extended public key for BIP44 wallets
   * Throws error for Ledger Live wallets
   */
  private getExtendedPublicKeyFor(
    vmType: NetworkVMType
  ): { key: string } | null {
    if (this.isLedgerLive()) {
      throw new Error(
        'Extended public keys are not available for Ledger Live wallets'
      )
    }

    if (!this.extendedPublicKeys) {
      return null
    }

    switch (vmType) {
      case NetworkVMType.EVM:
        return this.extendedPublicKeys.evm
          ? { key: this.extendedPublicKeys.evm }
          : null
      case NetworkVMType.AVM:
        return this.extendedPublicKeys.avalanche
          ? { key: this.extendedPublicKeys.avalanche }
          : null
      default:
        return null
    }
  }

  /**
   * Derive address from extended public key for BIP44 wallets
   * This allows creating new accounts without connecting to the device
   */
  public deriveAddressFromXpub(
    accountIndex: number,
    vmType: NetworkVMType,
    isTestnet = false
  ): string | null {
    if (this.isLedgerLive()) {
      throw new Error(
        'Address derivation from xpub is not supported for Ledger Live wallets'
      )
    }

    const extendedKey = this.getExtendedPublicKeyFor(vmType)
    if (!extendedKey) {
      return null
    }

    try {
      // Parse the extended public key
      const hdNode = bip32.fromBase58(extendedKey.key)

      // For BIP44, we derive: m/44'/coin_type'/account'/change/address_index
      // The extended key is already at m/44'/coin_type'/0' level
      // So we need to derive: change/address_index (0/accountIndex for BIP44)
      const childNode = hdNode.derive(0).derive(accountIndex)

      if (!childNode.publicKey) {
        throw new Error('Failed to derive public key')
      }

      // Convert public key to address based on VM type
      switch (vmType) {
        case NetworkVMType.EVM: {
          // For EVM, convert public key to Ethereum address
          return getEvmAddressFromPubKey(childNode.publicKey)
        }
        case NetworkVMType.AVM: {
          // For AVM (Avalanche X-Chain), we need to use Avalanche address format
          // This is more complex and would require Avalanche-specific address generation
          // For now, we'll return null and let it fall back to device connection
          return null
        }
        case NetworkVMType.PVM: {
          // For PVM (Avalanche P-Chain), we need to use Avalanche address format
          // This is more complex and would require Avalanche-specific address generation
          // For now, we'll return null and let it fall back to device connection
          return null
        }
        case NetworkVMType.BITCOIN: {
          // For Bitcoin, convert public key to Bitcoin address using provided network context
          return getBtcAddressFromPubKey(
            childNode.publicKey,
            isTestnet ? networks.testnet : networks.bitcoin
          )
        }
        default:
          return null
      }
    } catch (error) {
      Logger.error('Failed to derive address from extended public key:', error)
      return null
    }
  }

  /**
   * Check if new account creation requires device connection
   */
  public requiresDeviceForNewAccounts(): boolean {
    return this.isLedgerLive()
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
    accountIndex: _accountIndex,
    transaction,
    network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: BtcTransactionRequest
    network: Network
    provider: BitcoinProvider
  }): Promise<string> {
    const signer = await this.getBitcoinProvider(network.isTestnet)

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
    accountIndex: _accountIndex,
    transaction,
    network: _network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
    network: Network
    provider: Avalanche.JsonRpcProvider
  }): Promise<string> {
    const signer = await this.getAvalancheProvider(_accountIndex)

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

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async signEvmTransaction({
    accountIndex,
    transaction,
    network: _network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: TransactionRequest
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    Logger.info('signEvmTransaction called')

    // First ensure we're connected to the device
    Logger.info('Ensuring connection to Ledger device...')
    try {
      await LedgerService.ensureConnection(this.deviceId)
      Logger.info('Successfully connected to Ledger device')
    } catch (error) {
      Logger.error('Failed to connect to Ledger device:', error)
      throw new Error(
        'Please make sure your Ledger device is nearby, unlocked, and Bluetooth is enabled.'
      )
    }

    // Now ensure Avalanche app is ready
    Logger.info('Ensuring Avalanche app is ready...')
    try {
      await LedgerService.waitForApp(
        LedgerAppType.AVALANCHE,
        LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
      )
      Logger.info('Avalanche app is ready')
    } catch (error) {
      Logger.error('Failed to detect Avalanche app:', error)
      throw new Error(
        'Please open the Avalanche app on your Ledger device and try again.'
      )
    }

    // Get transport
    const transport = await this.getTransport()
    Logger.info('Got transport')

    // Create Avalanche app instance
    const avaxApp = new AppAvax(transport as Transport) // Type compatibility issue with different @ledgerhq versions
    Logger.info('Created Avalanche app instance')

    try {
      // Get the derivation path for this account
      const derivationPath = this.getDerivationPath(
        accountIndex,
        NetworkVMType.EVM
      )
      Logger.info('Using derivation path:', derivationPath)

      // First verify we can get the correct address
      Logger.info('Getting address from Ledger')
      const addressResult = await avaxApp.getETHAddress(derivationPath)
      Logger.info('Got address from Ledger:', addressResult.address)

      // Import ethers and create legacy transaction
      const { Transaction } = await import('ethers')
      const tx = {
        chainId: transaction.chainId || 43114,
        nonce: transaction.nonce || 0,
        gasPrice: transaction.maxFeePerGas, // Use maxFeePerGas as gasPrice
        gasLimit: transaction.gasLimit || 0,
        to: transaction.to?.toString() || '0x',
        value: transaction.value || 0,
        data: transaction.data || '0x'
      }

      Logger.info('Transaction data:', tx)

      // Create and serialize as legacy transaction
      const serializedTx = Transaction.from({
        ...tx,
        type: undefined // Force legacy transaction format
      }).unsignedSerialized
      // For legacy tx, just remove '0x'
      const unsignedTx = serializedTx.slice(2)
      Logger.info('Full serialized transaction:', serializedTx)
      Logger.info('Unsigned transaction (without type prefix):', unsignedTx)

      // Get the resolution for proper display
      Logger.info('Getting transaction resolution')
      // USDC.e contract on Avalanche
      const resolution = {
        externalPlugin: [],
        erc20Tokens: ['0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'],
        nfts: [],
        plugin: [],
        domains: []
      }
      Logger.info('Got transaction resolution')

      // Sign the transaction with Ledger
      Logger.info('Signing transaction with Ledger')
      Logger.info('Sending to device:', {
        derivationPath,
        unsignedTxLength: unsignedTx.length,
        resolution
      })
      let signature: { r: string; s: string; v: string }

      try {
        Logger.info('Calling signEVMTransaction with:', {
          derivationPath,
          unsignedTxLength: unsignedTx.length,
          resolution
        })
        const result = await avaxApp.signEVMTransaction(
          derivationPath,
          unsignedTx,
          resolution
        )
        Logger.info('Raw result from signEVMTransaction:', result)

        if (!result) {
          throw new Error('signEVMTransaction returned undefined')
        }

        signature = result
        Logger.info('Got signature from device:', signature)
        Logger.info('Got signature from Ledger')
      } catch (error) {
        Logger.error('Failed to get signature from device:', error)
        throw error
      }

      // Create the signed transaction
      const signedTx = Transaction.from({
        ...tx,
        signature: {
          r: `0x${signature.r}`,
          s: `0x${signature.s}`,
          v: BigInt('0x' + signature.v)
        }
      })

      Logger.info('Successfully signed transaction')
      return signedTx.serialized
    } catch (error) {
      Logger.error('Failed to sign transaction:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('6a80')) {
          throw new Error(
            'Wrong app open. Please open the Avalanche app on your Ledger device.'
          )
        } else if (error.message.includes('6985')) {
          throw new Error('Transaction rejected by user on Ledger device.')
        } else if (error.message.includes('6a86')) {
          throw new Error(
            'Avalanche app not ready. Please ensure the Avalanche app is open and ready.'
          )
        }
      }

      throw error
    }
  }

  public async signSvmTransaction({
    accountIndex,
    transaction,
    network: _network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: SolanaTransactionRequest
    network: Network
    provider: SolanaProvider
  }): Promise<string> {
    Logger.info('signSvmTransaction called')
    Logger.info('Transaction data:', {
      account: transaction.account,
      serializedTxLength: transaction.serializedTx?.length
    })

    // First ensure we're connected to the device
    Logger.info('Ensuring connection to Ledger device...')
    try {
      await LedgerService.ensureConnection(this.deviceId)
      Logger.info('Successfully connected to Ledger device')
    } catch (error) {
      Logger.error('Failed to connect to Ledger device:', error)
      throw new Error(
        'Please make sure your Ledger device is nearby, unlocked, and Bluetooth is enabled.'
      )
    }

    // Now ensure Solana app is ready
    Logger.info('Ensuring Solana app is ready...')
    try {
      await LedgerService.waitForApp(
        LedgerAppType.SOLANA,
        LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
      )
      Logger.info('Solana app is ready')
    } catch (error) {
      Logger.error('Failed to detect Solana app:', error)
      throw new Error(
        'Please open the Solana app on your Ledger device and try again.'
      )
    }

    // Get transport
    const transport = await this.getTransport()
    Logger.info('Got transport')

    // Create AppSolana instance
    const solanaApp = new AppSolana(transport as Transport)
    Logger.info('Created AppSolana instance')

    try {
      // Get the derivation path for this account
      const derivationPath = getSolanaDerivationPath(accountIndex)
      Logger.info('Using derivation path:', derivationPath)

      // First verify we can get the correct address
      const addressResult = await solanaApp.getAddress(derivationPath, false)
      // Convert the Buffer to base58
      const userAddress = bs58.encode(new Uint8Array(addressResult.address))
      Logger.info('Got address from Ledger:', userAddress)

      // Verify this is the correct account
      if (transaction.account !== userAddress) {
        throw new Error(
          `Account mismatch: transaction account ${transaction.account} does not match Ledger account ${userAddress}`
        )
      }

      // Deserialize and compile the transaction
      Logger.info('Deserializing transaction message')
      const txMessage = await deserializeTransactionMessage(
        transaction.serializedTx,
        _provider
      )

      Logger.info('Compiling Solana transaction')
      const { messageBytes } = compileSolanaTx(txMessage)
      Logger.info('Message bytes length:', messageBytes.length)

      // Sign the transaction with Ledger
      Logger.info('Signing transaction with Ledger')
      const signResult = await solanaApp.signTransaction(
        derivationPath,
        Buffer.from(messageBytes)
      )
      Logger.info('Got signature from Ledger')

      // Get the original signatures map to maintain correct types
      const { signatures } = compileSolanaTx(txMessage)
      const signedTransaction = serializeSolanaTx({
        messageBytes,
        signatures: {
          ...signatures,
          [userAddress]: Uint8Array.from(signResult.signature)
        }
      })

      Logger.info('Successfully signed transaction')
      return signedTransaction
    } catch (error) {
      Logger.error('Failed to sign transaction:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('6a80')) {
          throw new Error(
            'Wrong app open. Please open the Solana app on your Ledger device.'
          )
        } else if (error.message.includes('6985')) {
          throw new Error('Transaction rejected by user on Ledger device.')
        } else if (error.message.includes('6a86')) {
          throw new Error(
            'Solana app not ready. Please ensure the Solana app is open and ready.'
          )
        }
      }

      throw error
    }
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

  // Cleanup method to disconnect LedgerService when wallet is no longer needed
  public async cleanup(): Promise<void> {
    try {
      await LedgerService.disconnect()
      Logger.info('LedgerService disconnected successfully')
    } catch (error) {
      Logger.warn('Failed to disconnect LedgerService during cleanup:', error)
    }
  }

  public async getRawXpubXP(): Promise<string> {
    // TODO: implement this
    throw new Error('getRawXpubXP not implemented yet for LedgerWallet')
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Promise<string> {
    const signer = await this.getAvalancheProvider(accountIndex)
    const signature = await signer.signMessage(data)
    return signature.toString('hex')
  }

  // eslint-disable-next-line max-params
  private async signEvmMessage(
    data: string | TypedDataV1 | TypedData<MessageTypes>,
    accountIndex: number,
    _network: Network,
    provider: JsonRpcBatchInternal,
    rpcMethod: RpcMethod
  ): Promise<string> {
    const signer = await this.getEvmSigner(provider, accountIndex)

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
