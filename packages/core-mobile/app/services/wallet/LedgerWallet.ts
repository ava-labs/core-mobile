import {
  Avalanche,
  BitcoinLedgerWallet,
  BitcoinProvider,
  deserializeTransactionMessage,
  compileSolanaTx,
  serializeSolanaTx,
  getEvmAddressFromPubKey,
  getBtcAddressFromPubKey,
  BitcoinProviderAbstract
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
import Eth from '@ledgerhq/hw-app-eth'
import {
  AppClient as BtcClient,
  DefaultWalletPolicy,
  WalletPolicy
} from 'ledger-bitcoin'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import Transport from '@ledgerhq/hw-transport'
import { networks } from 'bitcoinjs-lib'
import { utils as avalancheUtils, networkIDs } from '@avalabs/avalanchejs'
import bs58 from 'bs58'
import { TransactionRequest, TypedDataEncoder } from 'ethers'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import LedgerService from 'services/ledger/LedgerService'
import BiometricsSDK from 'utils/BiometricsSDK'
import {
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerWalletData,
  PublicKey,
  PerAccountExtendedPublicKeys
} from 'services/ledger/types'
import {
  DERIVATION_PATHS,
  DerivationPathKey,
  LEDGER_TIMEOUTS,
  getSolanaDerivationPath
} from 'new/features/ledger/consts'
import { bip32 } from 'utils/bip32'
import Logger from 'utils/Logger'
import { Curve } from 'utils/publicKeys'
import { Account } from 'store/account'
import { uuid } from 'utils/uuid'
import { CoreAccountType } from '@avalabs/types'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'
import {
  Wallet,
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SolanaTransactionRequest,
  SignatureRSV
} from './types'
import { getAddressDerivationPath, handleLedgerError } from './utils'

export class LedgerWallet implements Wallet {
  private deviceId: string
  private derivationPathSpec: LedgerDerivationPathType
  private extendedPublicKeys?: PerAccountExtendedPublicKeys
  private publicKeys: PublicKey[]
  private bitcoinWallet?: BitcoinLedgerWallet
  private walletId: string

  constructor(ledgerData: LedgerWalletData & { walletId: string }) {
    this.deviceId = ledgerData.deviceId
    this.derivationPathSpec = ledgerData.derivationPathSpec
    this.publicKeys = ledgerData.publicKeys
    this.walletId = ledgerData.walletId

    // For BIP44 wallets, store extended public keys (per-account format)
    // For Ledger Live, extendedPublicKeys remains undefined
    if (ledgerData.derivationPathSpec === LedgerDerivationPathType.BIP44) {
      this.extendedPublicKeys = ledgerData.extendedPublicKeys
    }
  }

  private async getTransport(): Promise<TransportBLE> {
    Logger.info('getTransport called - using LedgerService')
    return LedgerService.ensureConnection(this.deviceId)
  }

  private async getBitcoinSigner(
    accountIndex = 0,
    bitcoinProvider: BitcoinProviderAbstract,
    network: Network
  ): Promise<BitcoinLedgerWallet> {
    try {
      const evmPubKey = BitcoinWalletPolicyService.getEvmPublicKey(
        this.publicKeys,
        accountIndex
      )

      if (!evmPubKey) {
        throw new Error(
          `EVM public key not found for account index ${accountIndex}`
        )
      }

      // Get wallet policy details from public key data for this specific account
      const btcPolicy =
        BitcoinWalletPolicyService.findBtcWalletPolicyInPublicKeys(
          this.publicKeys,
          accountIndex
        )

      if (btcPolicy === undefined) {
        Logger.error('Bitcoin wallet policy not found in public keys')
        throw new Error('Bitcoin wallet policy not found in public keys')
      }

      const walletPolicyDetails =
        BitcoinWalletPolicyService.parseWalletPolicyDetailsFromPublicKey(
          btcPolicy,
          accountIndex
        )
      Logger.info('Bitcoin wallet policy loaded from storage')

      // Derive the actual Bitcoin address public key from the registered xpub
      // The xpub was registered from path m/44'/60'/accountIndex'
      // We need to derive the address public key at path 0/0 from that xpub
      // Parse the xpub to get the HD node
      const hdNode = bip32.fromBase58(
        btcPolicy.xpub,
        network.isTestnet ? networks.testnet : networks.bitcoin
      )

      // Derive the Bitcoin address public key: m/44'/60'/accountIndex'/0/0
      // Since xpub is already at account level, we derive 0/0
      const addressNode = hdNode.derive(0).derive(0)

      if (!addressNode.publicKey) {
        throw new Error('Failed to derive Bitcoin address public key')
      }

      const transport = await this.getTransport()

      this.bitcoinWallet = new BitcoinLedgerWallet(
        addressNode.publicKey,
        evmPubKey.derivationPath,
        bitcoinProvider,
        transport as Transport,
        walletPolicyDetails
      )
      Logger.info('BitcoinLedgerWallet created successfully')
      return this.bitcoinWallet
    } catch (error) {
      Logger.error('Failed to create BitcoinLedgerWallet:', error)
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to create BitcoinLedgerWallet: ${errorMessage}`)
    }
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
   * Get extended public key for BIP44 wallets for a specific account index
   * Throws error for Ledger Live wallets
   */
  private getExtendedPublicKeyFor(
    vmType:
      | NetworkVMType.EVM
      | NetworkVMType.AVM
      | NetworkVMType.PVM
      | NetworkVMType.BITCOIN,
    accountIndex = 0
  ): { key: string } | null {
    if (this.isLedgerLive()) {
      throw new Error(
        'Extended public keys are not available for Ledger Live wallets'
      )
    }

    if (!this.extendedPublicKeys) {
      Logger.error(`[getExtendedPublicKeyFor] No extendedPublicKeys available`)
      return null
    }

    // Get keys for the specific account index
    const keys = this.extendedPublicKeys[accountIndex]

    if (!keys) {
      throw new Error(`No xpub found for account ${accountIndex}`)
    }

    return this.getKeyForVmType(keys, vmType)
  }

  private getKeyForVmType(
    keys: { evm: string; avalanche: string },
    vmType: NetworkVMType
  ): { key: string } | null {
    switch (vmType) {
      case NetworkVMType.EVM:
        return keys.evm ? { key: keys.evm } : null
      case NetworkVMType.AVM:
        return keys.avalanche ? { key: keys.avalanche } : null
      default:
        return null
    }
  }

  /**
   * Derive address from extended public key for BIP44 wallets
   * This allows creating new accounts without connecting to the device
   * Note: Requires the xpub for the specific account to be stored
   */
  public deriveAddressFromXpub(
    accountIndex: number,
    vmType:
      | NetworkVMType.EVM
      | NetworkVMType.AVM
      | NetworkVMType.PVM
      | NetworkVMType.BITCOIN,
    isTestnet = false
  ): string | null {
    if (this.isLedgerLive()) {
      throw new Error(
        'Address derivation from xpub is not supported for Ledger Live wallets'
      )
    }

    // Get the xpub for the specific account (BIP44 uses hardened account derivation)
    const extendedKey = this.getExtendedPublicKeyFor(vmType, accountIndex)
    if (!extendedKey) {
      return null
    }

    try {
      // Parse the extended public key
      const hdNode = bip32.fromBase58(extendedKey.key)

      // For BIP44, we derive: m/44'/coin_type'/account'/change/address_index
      // The extended key is at m/44'/coin_type'/account' level for this account
      // So we derive: change/address_index (0/0 for the first address)
      const childNode = hdNode.derive(0).derive(0)

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
    network
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
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
        return this.signEvmMessage({ data, accountIndex, network, rpcMethod })

      default:
        throw new Error('unknown method')
    }
  }

  /**
   * Register Bitcoin wallet policy with Ledger device
   * This must be done once before signing Bitcoin transactions
   */
  private async registerBitcoinWalletPolicy({
    accountName,
    accountIndex,
    walletId
  }: {
    accountName: string
    accountIndex: number
    walletId: string
  }): Promise<void> {
    Logger.info('Registering Bitcoin wallet policy with Ledger device')

    try {
      // Ensure device is connected
      const transport = await this.getTransport()

      // Ensure Bitcoin app is ready
      Logger.info('Ensuring Bitcoin app is ready...')
      await LedgerService.waitForApp(
        LedgerAppType.BITCOIN,
        LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
      )

      const btcApp = new BtcClient(transport as Transport)

      // Get master fingerprint from device
      const masterFpr = await btcApp.getMasterFingerprint()

      // Get EVM derivation path for this account
      const derivationPath = `44'/60'/${accountIndex}'`

      Logger.info(
        'Getting extended public key from device at path:',
        derivationPath
      )

      // Get extended public key from device
      const xpub = await btcApp.getExtendedPubkey(derivationPath, true)

      Logger.info('Extended public key retrieved')

      const keyInfo = `[${masterFpr}/${derivationPath}]${xpub}`

      // Create wallet policy for native SegWit (P2WPKH)
      // Format: [masterFpr/derivationPath]xpub
      const template = new DefaultWalletPolicy(`wpkh(@0/**)`, keyInfo)

      // Note: We use WalletPolicy (not DefaultWalletPolicy) because we need a named policy for registration
      const policyName = `Core - ${accountName}`
      const walletPolicy = new WalletPolicy(
        policyName,
        'wpkh(@0/**)', // Native SegWit descriptor template
        template.keys // keys array
      )

      Logger.info('Created wallet policy for registration')

      // Register the policy with the device
      Logger.info('Registering policy with Ledger device...')
      const [policyId, policyHmac] = await btcApp.registerWallet(walletPolicy)

      Logger.info('Wallet policy registered successfully:', {
        policyId: policyId.toString('hex'),
        policyHmacLength: policyHmac.length
      })

      // Store the policy details in wallet data
      const policyDetails = {
        hmacHex: policyHmac.toString('hex'),
        masterFingerprint: masterFpr,
        xpub,
        name: policyName
      }

      const stored = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId,
        publicKeys: this.publicKeys,
        policyDetails,
        accountIndex
      })

      if (!stored) {
        throw new Error('Failed to persist Bitcoin wallet policy')
      }

      Logger.info('Bitcoin wallet policy registered and persisted successfully')
    } catch (error) {
      Logger.error('Failed to register Bitcoin wallet policy:', error)
      throw new Error(
        `Failed to register Bitcoin wallet policy: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }

  public async signBtcTransaction({
    accountName,
    accountIndex,
    transaction,
    network,
    provider: _provider
  }: {
    accountName?: string
    accountIndex: number
    transaction: BtcTransactionRequest
    network: Network
    provider: BitcoinProvider
  }): Promise<string> {
    // Check if wallet policy is registered for this specific account
    const needsRegistration =
      BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
        this.publicKeys,
        accountIndex
      )

    if (needsRegistration) {
      Logger.info(
        'Bitcoin wallet policy not registered, registering for the first time...'
      )

      if (!this.walletId) {
        throw new Error(
          'Bitcoin wallet policy registration requires walletId. Please ensure walletId is set.'
        )
      }

      // Register the wallet policy with the Ledger device
      await this.registerBitcoinWalletPolicy({
        accountName: accountName || `Account ${accountIndex}`,
        accountIndex,
        walletId: this.walletId
      })

      // After registration, we need to reload the public keys to include the new policy
      // This is necessary because the storeBtcWalletPolicy updates the wallet data in BiometricsSDK
      const walletSecret = await BiometricsSDK.loadWalletSecret(this.walletId)
      if (walletSecret.success) {
        const updatedWalletData = JSON.parse(walletSecret.value)
        this.publicKeys = updatedWalletData.publicKeys
        Logger.info('Reloaded public keys with new Bitcoin wallet policy')
      }
    }
    const bitcoinProvider = await getBitcoinProvider(network.isTestnet)
    const signer = await this.getBitcoinSigner(
      accountIndex,
      bitcoinProvider,
      network
    )

    if (!(signer instanceof BitcoinLedgerWallet)) {
      throw new Error('Unable to sign btc transaction: invalid signer')
    }
    const txToSign = await this.prepareBtcTxForLedger(
      transaction,
      bitcoinProvider
    )
    const signedTx = await signer.signTx(txToSign.inputs, txToSign.outputs)
    return signedTx.toHex()
  }

  private async prepareBtcTxForLedger(
    tx: BtcTransactionRequest,
    provider: BitcoinProviderAbstract
  ): Promise<BtcTransactionRequest> {
    //get unique hashes
    const txHashSet = new Set<string>(tx.inputs.map(i => i.txHash))

    // Get the tx hex for each input tx in parallel
    const txHexDict: Record<string, string> = {}
    await Promise.all(
      Array.from(txHashSet, async hash => {
        const hex = await provider.getTxHex(hash)
        txHexDict[hash] = hex
      })
    )

    return {
      ...tx,
      inputs: tx.inputs.map(input => ({
        ...input,
        txHex: txHexDict[input.txHash]
      }))
    }
  }

  public async signAvalancheTransaction({
    accountIndex,
    transaction,
    network: _network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
    network: Network
    provider: Avalanche.JsonRpcProvider
  }): Promise<string> {
    Logger.info('signAvalancheTransaction called')
    const appType = LedgerAppType.AVALANCHE
    // Get transport and create Avalanche app instance directly
    // (bypassing SDK's ZondaxProvider which has module resolution issues in React Native)
    const transport = await this.handleAppConnection(appType)

    const avaxApp = new AppAvax(transport as Transport)

    // Get chain alias from transaction VM
    const vmName = transaction.tx.getVM()
    let chainAlias: 'X' | 'P' | 'C'
    switch (vmName) {
      case 'AVM':
        chainAlias = 'X'
        break
      case 'PVM':
        chainAlias = 'P'
        break
      case 'EVM':
        chainAlias = 'C'
        break
      default:
        throw new Error(`Unsupported VM type: ${vmName}`)
    }

    // Build the account path based on chain
    // For X/P chain: m/44'/9000'/{accountIndex}'
    // For C chain (EVM): m/44'/60'/{accountIndex}'
    const accountPath =
      chainAlias === 'C'
        ? `m/44'/60'/${accountIndex}'`
        : `m/44'/9000'/${accountIndex}'`

    // Build signing paths from external indices
    // For C-chain: always use 0/0 (first external address)
    // For X/P-chain: use external indices from UTXO analysis (default to [0] → '0/0' if empty)
    const externalIndices = transaction.externalIndices ?? []
    const hasIndices = externalIndices.length > 0
    const signingPaths =
      chainAlias === 'C'
        ? ['0/0']
        : (hasIndices ? externalIndices : [0]).map(i => `0/${i}`)

    // Build change paths from internal indices
    const changePaths = (transaction.internalIndices ?? []).map(i => `1/${i}`)

    // Serialize the transaction
    const txBuffer = Buffer.from(transaction.tx.toBytes())

    Logger.info('Calling avaxApp.sign...')
    try {
      // Sign directly with the Ledger device
      const signResult = await avaxApp.sign(
        accountPath,
        signingPaths,
        txBuffer,
        changePaths.length > 0 ? changePaths : undefined
      )
      Logger.info('avaxApp.sign completed')

      // Add signatures to the transaction
      const signatures = signResult.signatures || new Map()
      signatures.forEach(signature => {
        transaction.tx.addSignature(signature)
      })

      Logger.info('signAvalancheTransaction completed successfully')
      return JSON.stringify(transaction.tx.toJSON())
    } catch (signError) {
      Logger.error('avaxApp.sign failed with error:', signError)
      if (signError instanceof Error) {
        handleLedgerError({ error: signError, appType })
      }
      throw signError
    }
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async signEvmTransaction({
    accountIndex,
    transaction,
    network,
    provider: _provider
  }: {
    accountIndex: number
    transaction: TransactionRequest
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    Logger.info('signEvmTransaction called')

    // Determine chain type and required app
    const chainId = transaction.chainId ? Number(transaction.chainId) : 43114
    const isAvalanche = isAvalancheChainId(chainId)
    const appType = isAvalanche
      ? LedgerAppType.AVALANCHE
      : LedgerAppType.ETHEREUM

    // Get transport
    const transport = await this.handleAppConnection(appType)

    try {
      // Get the derivation path for this account
      const derivationPath = this.getDerivationPath(
        accountIndex,
        NetworkVMType.EVM
      )
      Logger.info('Using derivation path:', derivationPath)

      // Import ethers for transaction handling
      const { Transaction } = await import('ethers')
      const tx = {
        chainId,
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
      // For legacy tx, remove '0x' prefix
      const unsignedTx = serializedTx.slice(2)
      Logger.info('Full serialized transaction:', serializedTx)
      Logger.info('Unsigned transaction (without type prefix):', unsignedTx)

      let signature: SignatureRSV

      if (isAvalanche) {
        signature = await this.getCChainSignature({
          transport,
          derivationPath,
          unsignedTx
        })
      } else {
        signature = await this.getEvmSignature({
          transport,
          derivationPath,
          unsignedTx
        })
      }

      // Create the signed transaction
      const signedTx = Transaction.from({
        ...tx,
        signature: {
          r: `0x${signature.r}`,
          s: `0x${signature.s}`,
          v: BigInt(
            typeof signature.v === 'string' ? '0x' + signature.v : signature.v
          )
        }
      })

      Logger.info('Successfully signed transaction')
      return signedTx.serialized
    } catch (error) {
      Logger.error('Failed to sign transaction:', error)

      // Provide more specific error messages
      if (error instanceof Error) {
        handleLedgerError({ error, network })
      }

      throw error
    }
  }

  public async signSvmTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: SolanaTransactionRequest
    network: Network
    provider: SolanaProvider
  }): Promise<string> {
    const transport = await this.handleAppConnection(LedgerAppType.SOLANA)

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
        handleLedgerError({ error, network })
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

  // Cleanup method to disconnect LedgerService when wallet is no longer needed
  public async cleanup(): Promise<void> {
    try {
      await LedgerService.disconnect()
      Logger.info('LedgerService disconnected successfully')
    } catch (error) {
      Logger.warn('Failed to disconnect LedgerService during cleanup:', error)
    }
  }

  public async getRawXpubXP(accountIndex: number): Promise<string> {
    if (!this.isBIP44() || !this.extendedPublicKeys) {
      throw new Error('getRawXpubXP not available for this wallet type')
    }

    const accountKeys = this.extendedPublicKeys[accountIndex]
    if (accountKeys?.avalanche) {
      return accountKeys.avalanche
    }

    throw new Error(`No xpub stored for account index ${accountIndex}`)
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
    Logger.info('signAvalancheMessage called')
    const appType = LedgerAppType.AVALANCHE
    // Get transport and create Avalanche app instance directly
    const transport = await this.handleAppConnection(appType)

    try {
      const avaxApp = new AppAvax(transport as Transport)
      Logger.info('Created AppAvax instance')

      // Get the account path for Avalanche (X-Chain/P-Chain use 9000')
      const accountPath =
        DERIVATION_PATHS.EXTENDED[DerivationPathKey.AVALANCHE](accountIndex)
      Logger.info('Using account path:', accountPath)

      // Signing paths for the first address (0/0)
      // For message signing, we typically only sign with the primary address (0/0),
      // which is the expected behavior.
      const signingPaths = ['0/0']

      // Convert message to string if needed
      const messageString =
        typeof data === 'string' ? data : JSON.stringify(data)

      Logger.info('Signing message with AppAvax.signMsg')
      // Sign the message using the Avalanche app
      const signResult = await avaxApp.signMsg(
        accountPath,
        signingPaths,
        messageString
      )

      // Extract the signature from the result
      const signatures = signResult.signatures || new Map()
      if (signatures.size === 0) {
        throw new Error('No signatures returned from device')
      }

      // Get the first signature and convert to hex
      const signatureBuffer = Array.from(signatures.values())[0]
      const hexSignature = signatureBuffer.toString('hex')
      Logger.info('Successfully signed Avalanche message')
      return hexSignature
    } catch (error) {
      Logger.error('Failed to sign Avalanche message:', error)
      if (error instanceof Error) {
        handleLedgerError({ error, appType })
      }
      throw error
    }
  }

  /**
   * Filter EIP-712 types to only include primary type and its dependencies
   * This prevents "ambiguous primary types or unused types" errors
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private filterEIP712Types(
    types: Record<string, Array<{ name: string; type: string }>>,
    primaryType: string,
    domain: Record<string, unknown>
  ): Record<string, Array<{ name: string; type: string }>> & {
    EIP712Domain: Array<{ name: string; type: string }>
  } {
    const filtered: Record<string, Array<{ name: string; type: string }>> = {}
    const visited = new Set<string>()

    // Always include EIP712Domain - either from types or infer from domain
    if (types.EIP712Domain) {
      filtered.EIP712Domain = types.EIP712Domain
    } else {
      // Infer EIP712Domain from the domain object
      filtered.EIP712Domain = Object.keys(domain).map(key => {
        const value = domain[key]
        let type = 'string'
        if (typeof value === 'number' || typeof value === 'bigint') {
          type = 'uint256'
        } else if (
          typeof value === 'string' &&
          value.match(/^0x[a-fA-F0-9]{40}$/)
        ) {
          type = 'address'
        }
        return { name: key, type }
      })
    }
    visited.add('EIP712Domain')

    // Recursively collect all types referenced by the primary type
    const collectDependencies = (typeName: string) => {
      if (visited.has(typeName) || !types[typeName]) {
        return
      }

      visited.add(typeName)
      filtered[typeName] = types[typeName]

      // Find all referenced types
      types[typeName].forEach(field => {
        // Extract the base type (e.g., "Person[]" -> "Person")
        const match = field.type.match(/^([A-Z]\w*)/)
        if (match) {
          const referencedType = match[1]
          // Only follow if it's a custom type (starts with capital letter)
          // and not a standard Solidity type
          if (
            referencedType &&
            types[referencedType] &&
            !['EIP712Domain'].includes(referencedType)
          ) {
            collectDependencies(referencedType)
          }
        }
      })
    }

    // Start from the primary type
    collectDependencies(primaryType)

    return filtered as typeof filtered & {
      EIP712Domain: Array<{ name: string; type: string }>
    }
  }

  /**
   * Consolidated method to sign EIP-712 messages with fallback for Nano S devices
   */
  /**
   * Returns true only for errors that indicate the device firmware lacks the
   * capability to execute signEIP712Message (e.g. Nano S). User-rejection and
   * other definitive failures must NOT trigger a silent retry.
   *
   * Known capability error status codes:
   *   0x6d00 – INS_NOT_SUPPORTED
   *   0x6e00 – CLA_NOT_SUPPORTED
   */
  private isDeviceCapabilityError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const msg = error.message.toLowerCase()
    return (
      msg.includes('0x6d00') ||
      msg.includes('0x6e00') ||
      msg.includes('ins_not_supported') ||
      msg.includes('cla_not_supported')
    )
  }

  private async signEIP712WithFallback(
    app: Eth | AppAvax,
    derivationPath: string,
    eip712Message: {
      domain: Record<string, unknown>
      types: Record<string, Array<{ name: string; type: string }>> & {
        EIP712Domain: Array<{ name: string; type: string }>
      }
      primaryType: string
      message: Record<string, unknown>
    }
  ): Promise<string> {
    let signature
    try {
      signature = await app.signEIP712Message(derivationPath, eip712Message)
    } catch (error) {
      // Only fall back to hash mode for Nano S (firmware lacks clear-signing
      // support). Rethrow user rejections and all other definitive failures so
      // they surface to the caller without a second signing prompt.
      if (!this.isDeviceCapabilityError(error)) {
        throw error
      }

      Logger.warn(
        'signEIP712Message not supported on this device, falling back to signEIP712HashedMessage',
        error
      )

      // Compute domain separator and message hash
      const domainSeparatorHash = TypedDataEncoder.hashDomain(
        eip712Message.domain
      )

      // For message hash: exclude EIP712Domain from types.
      // Use TypedDataEncoder.hashStruct with an explicit primary type so the
      // hash does not depend on object key insertion order.
      const typesWithoutDomain = Object.keys(eip712Message.types)
        .filter(key => key !== 'EIP712Domain')
        .reduce((acc, key) => {
          const typeValue = eip712Message.types[key]
          if (typeValue) {
            acc[key] = typeValue
          }
          return acc
        }, {} as Record<string, Array<{ name: string; type: string }>>)

      const messageHash = TypedDataEncoder.hashStruct(
        eip712Message.primaryType,
        typesWithoutDomain,
        eip712Message.message
      )

      signature = await app.signEIP712HashedMessage(
        derivationPath,
        domainSeparatorHash,
        messageHash
      )
    }

    return this.getHexSignature(signature)
  }

  private validateTypedData(typedData: TypedData<MessageTypes>) {
    if (!typedData.domain) {
      throw new Error('TypedData missing required field: domain')
    }
    if (!typedData.types) {
      throw new Error('TypedData missing required field: types')
    }
    if (!typedData.primaryType) {
      throw new Error('TypedData missing required field: primaryType')
    }
    if (!typedData.message) {
      throw new Error('TypedData missing required field: message')
    }
  }

  private async handleSignedTypedData({
    data,
    rpcMethod,
    derivationPath,
    chainId
  }: {
    data: string | TypedDataV1 | TypedData<MessageTypes>
    rpcMethod: RpcMethod
    derivationPath: string
    chainId: number
  }): Promise<string> {
    const appType = isAvalancheChainId(chainId)
      ? LedgerAppType.AVALANCHE
      : LedgerAppType.ETHEREUM
    // Get transport and create Ethereum app instance
    const transport = await this.handleAppConnection(appType)
    const app = isAvalancheChainId(chainId)
      ? new AppAvax(transport as Transport)
      : new Eth(transport as Transport)

    // Check if this is EIP-712 v1 format (array of {name, type, value})
    const isV1Format =
      Array.isArray(data) ||
      (typeof data === 'string' && data.trim().startsWith('['))

    if (isV1Format || rpcMethod === RpcMethod.SIGN_TYPED_DATA_V1) {
      Logger.error(
        'eth_signTypedData v1 format is not supported on Ledger devices'
      )
      throw new Error(
        'eth_signTypedData v1 is not supported on Ledger devices.'
      )
    }

    // Handle EIP-712 v3/v4 format
    Logger.info('Handling EIP-712 v3/v4 format')

    // Parse data if it's a string
    let typedData: TypedData<MessageTypes>
    if (typeof data === 'string') {
      try {
        typedData = JSON.parse(data) as TypedData<MessageTypes>
        Logger.info('Parsed typed data from string')
      } catch (parseError) {
        Logger.error('Failed to parse typed data string:', parseError)
        throw new Error(
          'Invalid typed data format: expected JSON string or object'
        )
      }
    } else {
      typedData = data as TypedData<MessageTypes>
    }

    // Validate required fields
    this.validateTypedData(typedData)

    // Use signEIP712Message for EIP-712 typed data
    // The library expects the full EIP-712 message object
    // Filter types to only include primary type and its dependencies
    const filteredTypes = this.filterEIP712Types(
      typedData.types,
      String(typedData.primaryType),
      typedData.domain
    )

    const eip712Message = {
      domain: typedData.domain,
      types: filteredTypes,
      primaryType: String(typedData.primaryType),
      message: typedData.message
    }

    Logger.info('Prepared EIP712 message for signing', {
      primaryType: eip712Message.primaryType,
      hasEIP712Domain: !!eip712Message.types.EIP712Domain,
      originalTypesCount: Object.keys(typedData.types).length,
      filteredTypesCount: Object.keys(filteredTypes).length,
      filteredTypes: Object.keys(filteredTypes)
    })

    const hexSignature = await this.signEIP712WithFallback(
      app,
      derivationPath,
      eip712Message
    )
    Logger.info('Successfully signed typed data')
    return hexSignature
  }

  private async handleEthAndPersonalSign({
    data,
    derivationPath
  }: {
    data: string | TypedDataV1 | TypedData<MessageTypes>
    derivationPath: string
  }): Promise<string> {
    const appType = LedgerAppType.ETHEREUM
    // Get transport and create Ethereum app instance
    const transport = await this.handleAppConnection(appType)
    const app = new Eth(transport as Transport)

    // Handle personal sign and eth_sign
    Logger.info('Signing personal message')
    const messageToSign = typeof data === 'string' ? data : JSON.stringify(data)

    // Remove 0x prefix if present
    const messageHex = messageToSign.startsWith('0x')
      ? messageToSign.slice(2)
      : Buffer.from(messageToSign, 'utf8').toString('hex')

    const signature = await app.signPersonalMessage(derivationPath, messageHex)

    // Convert signature to hex format (0x-prefixed)
    const hexSignature = this.getHexSignature(signature)
    Logger.info('Successfully signed personal message')
    return hexSignature
  }

  private async signEvmMessage({
    data,
    accountIndex,
    network,
    rpcMethod
  }: {
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    rpcMethod: RpcMethod
  }): Promise<string> {
    // Get the derivation path for this account
    const derivationPath = this.getDerivationPath(
      accountIndex,
      NetworkVMType.EVM
    )
    try {
      if (
        rpcMethod === RpcMethod.SIGN_TYPED_DATA ||
        rpcMethod === RpcMethod.SIGN_TYPED_DATA_V1 ||
        rpcMethod === RpcMethod.SIGN_TYPED_DATA_V3 ||
        rpcMethod === RpcMethod.SIGN_TYPED_DATA_V4
      ) {
        return this.handleSignedTypedData({
          data,
          rpcMethod,
          derivationPath,
          chainId: network.chainId
        })
      } else if (
        rpcMethod === RpcMethod.ETH_SIGN ||
        rpcMethod === RpcMethod.PERSONAL_SIGN
      ) {
        return this.handleEthAndPersonalSign({ data, derivationPath })
      } else {
        throw new Error('This function is not supported on your wallet')
      }
    } catch (error) {
      Logger.error('Failed to sign EVM message:', error)
      if (error instanceof Error) {
        handleLedgerError({ error, network })
      }
      throw error
    }
  }

  public async addAccount({
    index,
    isTestnet,
    walletId,
    name
  }: {
    index: number
    isTestnet: boolean
    walletId: string
    name: string
  }): Promise<{
    account: Account
    xpub: { evm: string; avalanche: string }
  }> {
    const appType = LedgerAppType.AVALANCHE
    await this.handleAppConnection(appType)

    const addresses = await LedgerService.getAllAddresses(index, 1, isTestnet)
    const addressC = addresses.find(addr => addr.id.includes('evm'))?.address
    const addressAVM = addresses.find(addr =>
      addr.id.includes('avalanche-x')
    )?.address
    const addressPVM = addresses.find(addr =>
      addr.id.includes('avalanche-p')
    )?.address
    const addressBTC = addresses.find(addr =>
      addr.id.includes('bitcoin')
    )?.address

    if (!addressC || !addressAVM || !addressPVM || !addressBTC) {
      throw new Error('Failed to derive all addresses from Ledger')
    }

    // Derive C-chain bech32 address from EVM address
    // CoreEth is the EVM address (hex) encoded in bech32 format with C- prefix
    const hrp = isTestnet ? networkIDs.FujiHRP : networkIDs.MainnetHRP
    const evmAddressBytes = new Uint8Array(
      Buffer.from(addressC.replace(/^0x/, ''), 'hex')
    )
    const addressCoreEth = `C-${avalancheUtils.formatBech32(
      hrp,
      evmAddressBytes
    )}`

    // Get extended public keys for this account (device is already connected)
    const extendedKeys = await LedgerService.getExtendedPublicKeys(index)
    const xpub = {
      evm: bip32
        .fromPublicKey(
          Buffer.from(extendedKeys.evm.key, 'hex'),
          Buffer.from(extendedKeys.evm.chainCode, 'hex')
        )
        .toBase58(),
      avalanche: bip32
        .fromPublicKey(
          Buffer.from(extendedKeys.avalanche.key, 'hex'),
          Buffer.from(extendedKeys.avalanche.chainCode, 'hex')
        )
        .toBase58()
    }

    return {
      account: {
        index,
        id: uuid(),
        walletId,
        name,
        type: CoreAccountType.PRIMARY,
        addressBTC,
        addressC,
        addressAVM,
        addressPVM,
        addressCoreEth,
        addressSVM: ''
      },
      xpub
    }
  }

  private getCChainSignature = async ({
    transport,
    derivationPath,
    unsignedTx
  }: {
    transport: TransportBLE
    derivationPath: string
    unsignedTx: string
  }): Promise<SignatureRSV> => {
    // Use Avalanche app for Avalanche C-Chain
    const avaxApp = new AppAvax(transport as Transport)
    Logger.info('Created Avalanche app instance')

    // Verify we can get the correct address
    Logger.info('Getting address from Ledger')
    const addressResult = await avaxApp.getETHAddress(derivationPath)
    Logger.info('Got address from Ledger:', addressResult.address)

    // Get the resolution for proper display
    const resolution = {
      externalPlugin: [],
      erc20Tokens: [],
      nfts: [],
      plugin: [],
      domains: []
    }

    // Sign with Avalanche app
    Logger.info('Signing transaction with Avalanche app')
    const signature = await avaxApp.signEVMTransaction(
      derivationPath,
      unsignedTx,
      resolution
    )

    if (!signature) {
      throw new Error('signEVMTransaction returned undefined')
    }

    Logger.info('Got signature from Avalanche app:', signature)
    return signature
  }

  private getEvmSignature = async ({
    transport,
    derivationPath,
    unsignedTx
  }: {
    transport: TransportBLE
    derivationPath: string
    unsignedTx: string
  }): Promise<SignatureRSV> => {
    // Use Ethereum app for other EVM chains
    const ethApp = new Eth(transport as Transport)
    Logger.info('Created Ethereum app instance')

    // Verify we can get the correct address
    Logger.info('Getting address from Ledger')
    const addressResult = await ethApp.getAddress(derivationPath)
    Logger.info('Got address from Ledger:', addressResult.address)

    // Sign with Ethereum app
    Logger.info('Signing transaction with Ethereum app')
    const result = await ethApp.signTransaction(derivationPath, unsignedTx)

    if (!result) {
      throw new Error('signTransaction returned undefined')
    }

    const signature = {
      r: result.r,
      s: result.s,
      v: result.v
    }
    Logger.info('Got signature from Ethereum app:', signature)
    return signature
  }

  private handleAppConnection = async (
    appType: LedgerAppType
  ): Promise<TransportBLE> => {
    // First ensure we're connected to the device
    Logger.info('Ensuring connection to Ledger device...')
    let transport: TransportBLE
    try {
      transport = await LedgerService.ensureConnection(this.deviceId)
      Logger.info('Successfully connected to Ledger device')
    } catch (error) {
      Logger.error('Failed to connect to Ledger device:', error)
      if (error instanceof Error) {
        handleLedgerError({ error, appType })
      }
      throw error
    }

    // Ensure the correct app is ready
    Logger.info(`Ensuring ${appType} app is ready...`)
    try {
      await LedgerService.openApp(appType)
      await LedgerService.waitForApp(appType, LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT)
      Logger.info(`${appType} app is ready`)
      return transport
    } catch (error) {
      Logger.error(`Failed to detect ${appType} app:`, error)
      if (error instanceof Error) {
        handleLedgerError({ error, appType })
      }
      throw error
    }
  }

  // Convert signature to hex format (0x-prefixed)
  private getHexSignature = (signature: SignatureRSV): string => {
    const r = signature.r.padStart(64, '0')
    const s = signature.s.padStart(64, '0')
    const v = signature.v.toString(16).padStart(2, '0')
    return `0x${r}${s}${v}`
  }
}
