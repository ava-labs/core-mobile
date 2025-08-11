import {
  Avalanche,
  BitcoinLedgerWallet,
  LedgerSigner,
  BitcoinProvider,
  deserializeTransactionMessage,
  compileSolanaTx,
  serializeSolanaTx
} from '@avalabs/core-wallets-sdk'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { now } from 'moment'
import Logger from 'utils/Logger'
import { TransactionRequest } from 'ethers'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal, SolanaProvider } from '@avalabs/core-wallets-sdk'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import AppSolana from '@ledgerhq/hw-app-solana'
import AppAvax from '@avalabs/hw-app-avalanche'
import bs58 from 'bs58'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import { LedgerService } from 'services/ledger/ledgerService'
import { LedgerAppType } from 'services/ledger/ledgerService'

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
  transport?: TransportBLE // Optional for backward compatibility
}

export class LedgerWallet implements Wallet {
  private deviceId: string
  private derivationPath: string
  private vmType: NetworkVMType
  private derivationPathSpec?: string
  private extendedPublicKeys?: any
  private publicKeys?: any[]
  private transport?: TransportBLE // Keep for backward compatibility
  private ledgerService: LedgerService
  private evmSigner?: LedgerSigner
  private avalancheSigner?:
    | Avalanche.SimpleLedgerSigner
    | Avalanche.LedgerSigner
  private bitcoinWallet?: BitcoinLedgerWallet

  constructor(ledgerData: LedgerWalletData, ledgerService?: LedgerService) {
    this.deviceId = ledgerData.deviceId
    this.derivationPath = ledgerData.derivationPath
    this.vmType = ledgerData.vmType
    this.derivationPathSpec = ledgerData.derivationPathSpec
    this.extendedPublicKeys = ledgerData.extendedPublicKeys
    this.publicKeys = ledgerData.publicKeys
    this.transport = ledgerData.transport // Keep for backward compatibility

    // Use provided LedgerService or create new one
    if (ledgerService) {
      Logger.info('Using provided LedgerService instance')
      this.ledgerService = ledgerService
    } else {
      Logger.info('Creating new LedgerService instance')
      this.ledgerService = new LedgerService()
    }
  }

  private async getTransport(): Promise<TransportBLE> {
    Logger.info('getTransport called - checking LedgerService connection')

    // Use LedgerService transport if available, fallback to stored transport
    if (this.ledgerService.isConnected()) {
      Logger.info('LedgerService is connected, using its transport')
      return this.ledgerService.getTransport()
    }

    Logger.info('LedgerService not connected, attempting to reconnect')

    // Try to connect using LedgerService
    try {
      Logger.info(
        'Calling ledgerService.ensureConnection with deviceId:',
        this.deviceId
      )
      const transport = await this.ledgerService.ensureConnection(this.deviceId)
      Logger.info('Successfully reconnected via LedgerService')
      return transport
    } catch (error) {
      Logger.error('Failed to reconnect via LedgerService:', error)

      // Fallback to stored transport if LedgerService connection fails
      if (this.transport) {
        Logger.warn('Using fallback transport from stored data')
        return this.transport
      }

      Logger.error('No transport available - throwing error')
      throw new Error('No transport available for Ledger wallet')
    }
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
        transport: this.transport,
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
          transport as any,
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

      if (this.derivationPathSpec === 'BIP44') {
        // BIP44 mode - use extended public keys
        const extPublicKey = this.getExtendedPublicKeyFor(NetworkVMType.AVM)
        if (!extPublicKey) {
          throw new Error('Missing extended public key for AVM')
        }

        this.avalancheSigner = new Avalanche.SimpleLedgerSigner(
          targetAccountIndex,
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
          transport as any // TransportBLE is runtime compatible with wallets SDK expectations
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

      const transport = await this.getTransport()

      // BitcoinLedgerWallet constructor needs: publicKey, derivationPath, provider, transport, walletPolicyDetails
      this.bitcoinWallet = new BitcoinLedgerWallet(
        Buffer.from(this.deviceId, 'hex'), // publicKey - using deviceId as placeholder, should be actual public key
        this.derivationPath,
        bitcoinProvider, // provider - BitcoinProviderAbstract
        transport as any, // transport
        walletPolicyDetails as any // Use actual wallet policy details or null if not available
      )

      Logger.info('bitcoinLedgerWallet end', now())
    }
    return this.bitcoinWallet
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
    accountIndex: _accountIndex,
    transaction,
    network: _network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: BtcTransactionRequest
    network: Network
    provider: BitcoinProvider
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

  public async signEvmTransaction({
    accountIndex,
    transaction,
    network: _network,
    provider
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
      await this.ledgerService.ensureConnection(this.deviceId)
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
      await this.ledgerService.waitForApp(LedgerAppType.AVALANCHE, 60000) // 60 second timeout
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
    const avaxApp = new AppAvax(transport)
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
    provider
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
      await this.ledgerService.ensureConnection(this.deviceId)
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
      await this.ledgerService.waitForApp(LedgerAppType.SOLANA, 60000) // 60 second timeout
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
    const solanaApp = new AppSolana(transport)
    Logger.info('Created AppSolana instance')

    try {
      // Get the derivation path for this account
      const derivationPath = `44'/501'/0'/0'/${accountIndex}`
      Logger.info('Using derivation path:', derivationPath)

      // First verify we can get the correct address
      const addressResult = await solanaApp.getAddress(derivationPath, false)
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
        provider
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

      // Get the original signatures map and add our new signature
      const { signatures } = compileSolanaTx(txMessage)
      const signatureBytes = Uint8Array.from(signResult.signature)
      const signedTransaction = serializeSolanaTx({
        messageBytes,
        signatures: { ...signatures, [userAddress]: signatureBytes }
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

  /**
   * Sign with direct AppSolana approach (simple test first)
   */
  private async signWithDirectSolanaApp(
    accountIndex: number,
    transaction: SolanaTransactionRequest,
    provider: SolanaProvider
  ): Promise<string> {
    Logger.info('signWithDirectSolanaApp called')

    // Follow the exact same pattern as getSolanaProvider()
    Logger.info('Ensuring Solana app is ready...')
    await this.ledgerService.waitForApp(LedgerAppType.SOLANA)
    Logger.info('Solana app is ready')

    const transport = await this.getTransport()
    Logger.info('Got transport, creating AppSolana')

    const solanaApp = new AppSolana(transport)
    Logger.info('Created AppSolana instance')

    // Get the derivation path for this account
    const derivationPath = `44'/501'/0'/0'/${accountIndex}`
    Logger.info('Using derivation path:', derivationPath)

    // First, just try to get the address to see if connection works
    try {
      const addressResult = await solanaApp.getAddress(derivationPath, false)
      Logger.info(
        'Successfully got address from Ledger:',
        bs58.encode(new Uint8Array(addressResult.address))
      )

      // If we got here, the connection is working, now try signing
      Logger.info('Connection verified, attempting to sign transaction')
      Logger.info(
        'Transaction serialized tx length:',
        transaction.serializedTx.length
      )

      // Try to deserialize and compile the transaction properly
      const txMessage = await deserializeTransactionMessage(
        transaction.serializedTx,
        provider
      )
      const { messageBytes } = compileSolanaTx(txMessage)

      Logger.info(
        'Deserialized transaction, message bytes length:',
        messageBytes.length
      )

      const signResult = await solanaApp.signTransaction(
        derivationPath,
        Buffer.from(messageBytes)
      )

      Logger.info('Direct signing completed successfully')

      // For now, just return the original transaction since we need to properly reconstruct it
      // This is just to test that the signing part works
      Logger.info('Signature received, length:', signResult.signature.length)

      throw new Error(
        'Direct signing test completed - signature received but not integrated yet'
      )
    } catch (error) {
      Logger.error('Error in direct Solana app signing:', error)
      throw error
    }
  }

  /**
   * Old complex method - keeping for reference but not using
   */
  private async signSolanaTransactionDirect_OLD({
    accountIndex,
    transaction,
    provider,
    transport
  }: {
    accountIndex: number
    transaction: SolanaTransactionRequest
    provider: SolanaProvider
    transport: TransportBLE
  }): Promise<string> {
    Logger.info('signSolanaTransactionDirect called')

    // Create AppSolana instance
    const solanaApp = new AppSolana(transport)
    Logger.info('Created AppSolana instance')

    try {
      // Deserialize the transaction to get the message
      Logger.info('Deserializing transaction message')
      const txMessage = await deserializeTransactionMessage(
        transaction.serializedTx,
        provider
      )

      // Compile the transaction to get message bytes and signatures
      Logger.info('Compiling Solana transaction')
      const { signatures, messageBytes } = compileSolanaTx(txMessage)

      // Get the user's public key for this account
      const derivationPath = `44'/501'/0'/0'/${accountIndex}`
      Logger.info(
        'Getting user public key with derivation path:',
        derivationPath
      )

      const addressResult = await solanaApp.getAddress(derivationPath, false)
      const userPublicKey = addressResult.address
      const userPublicKeyString = userPublicKey.toString('hex')

      // Also get the Solana address format for comparison with transaction.account
      const userAddressBase58 = bs58.encode(new Uint8Array(userPublicKey))

      Logger.info('User public key (hex):', userPublicKeyString)
      Logger.info('User address (base58):', userAddressBase58)
      Logger.info('Transaction account:', transaction.account)
      Logger.info('Existing signatures:', Object.keys(signatures))

      // Verify this is the correct account
      if (transaction.account !== userAddressBase58) {
        throw new Error(
          `Account mismatch: transaction account ${transaction.account} does not match Ledger account ${userAddressBase58}`
        )
      }

      // Check if this user needs to sign the transaction
      // First try with the base58 address format, then with hex public key
      const needsSignature =
        this.requiresSolanaSignature(userAddressBase58, signatures) ||
        this.requiresSolanaSignature(userPublicKeyString, signatures)

      if (!needsSignature) {
        Logger.info('No signature required from this user')
        return transaction.serializedTx
      }

      // Sign the transaction message with Ledger
      Logger.info('Signing transaction message with Ledger app')
      const signResult = await solanaApp.signTransaction(
        derivationPath,
        Buffer.from(messageBytes)
      )

      Logger.info('Transaction signed successfully with Ledger app')

      // Add the signature to the transaction
      // Use the appropriate key format that matches the signatures object
      const signatureKey =
        userAddressBase58 in signatures
          ? userAddressBase58
          : userPublicKeyString
      const updatedSignatures = {
        ...signatures,
        [signatureKey]: signResult.signature
      }

      // Serialize the transaction with the new signature
      Logger.info('Serializing signed transaction')
      const signedTransaction = serializeSolanaTx({
        messageBytes,
        signatures: updatedSignatures
      })

      Logger.info('Direct Ledger app signing completed successfully')
      return signedTransaction
    } catch (error) {
      Logger.error('Direct Ledger app signing failed:', error)

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

      throw new Error(
        `Failed to sign Solana transaction with direct Ledger app: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  /**
   * Check if a signature is required for the given address
   */
  private requiresSolanaSignature(
    address: string,
    signatures: Record<string, Uint8Array | null>
  ): boolean {
    // If the address is in the signatures object and has no signature (null), it needs to be signed
    return address in signatures && signatures[address] === null
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
      await this.ledgerService.disconnect()
      Logger.info('LedgerService disconnected successfully')
    } catch (error) {
      Logger.warn('Failed to disconnect LedgerService during cleanup:', error)
    }
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
