import {
  Avalanche,
  BitcoinLedgerWallet,
  LedgerSigner,
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
import { TransactionRequest } from 'ethers'
import { now } from 'moment'
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
  private evmSigner?: LedgerSigner
  private avalancheSigner?:
    | Avalanche.SimpleLedgerSigner
    | Avalanche.LedgerSigner
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

  private async getEvmSigner({
    provider,
    accountIndex
  }: {
    provider?: JsonRpcBatchInternal
    accountIndex: number
  }): Promise<LedgerSigner> {
    if (!this.evmSigner) {
      Logger.info('evmLedgerSigner', now())

      Logger.info('getEvmSigner', {
        provider,
        transport: this.getTransport(),
        derivationPathSpec: this.derivationPathSpec,
        accountIndex
      })

      try {
        const transport = await this.getTransport()

        // Create LedgerSigner with the correct signature from SDK:
        // constructor(accountIndex, transport, derivationSpec, provider?)
        this.evmSigner = new LedgerSigner(
          accountIndex,
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
    accountIndex: number
  ): Promise<Avalanche.SimpleLedgerSigner | Avalanche.LedgerSigner> {
    if (!this.avalancheSigner) {
      const transport = await this.getTransport()

      if (this.derivationPathSpec === LedgerDerivationPathType.BIP44) {
        // BIP44 mode - use extended public keys for the specific account
        const extPublicKey = this.getExtendedPublicKeyFor(
          NetworkVMType.AVM,
          accountIndex
        )
        if (!extPublicKey) {
          throw new Error(
            `Missing extended public key for AVM account ${accountIndex}`
          )
        }

        this.avalancheSigner = new Avalanche.SimpleLedgerSigner(
          accountIndex,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transport as any, // TransportBLE is runtime compatible with wallets SDK expectations
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transport as any // TransportBLE is runtime compatible with wallets SDK expectations
        )
      }
    }
    return this.avalancheSigner
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
      Logger.error(`No extendedPublicKeys available`)
      return null
    }

    // Get keys for the specific account index
    const keys = this.extendedPublicKeys[accountIndex]

    if (!keys) {
      throw new Error(`No xpub found for account ${accountIndex}`)
    }

    return this.getKeyForVmType(keys, vmType)
  }

  // TODO: Get Btc xpub
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
      await LedgerService.ensureConnection(this.deviceId)

      // Ensure Bitcoin app is ready
      Logger.info('Ensuring Bitcoin app is ready...')
      await LedgerService.waitForApp(
        LedgerAppType.BITCOIN,
        LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
      )

      const transport = await this.getTransport()
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
    const signer = await this.getAvalancheProvider(accountIndex)

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
    network,
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
      if (error instanceof Error) {
        handleLedgerError({ error, network })
      }
      throw error
    }

    // Determine chain type and required app
    const chainId = transaction.chainId ? Number(transaction.chainId) : 43114
    const isAvalanche = isAvalancheChainId(chainId)
    const appName = isAvalanche
      ? LedgerAppType.AVALANCHE
      : LedgerAppType.ETHEREUM

    // Ensure the correct app is ready
    Logger.info(`Ensuring ${appName} app is ready...`)
    try {
      await LedgerService.openApp(appName)
      await LedgerService.waitForApp(appName, LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT)
      Logger.info(`${appName} app is ready`)
    } catch (error) {
      Logger.error(`Failed to detect ${appName} app:`, error)
      if (error instanceof Error) {
        handleLedgerError({ error, network })
      }
      throw error
    }

    // Get transport
    const transport = await this.getTransport()
    Logger.info('Got transport')

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
      if (error instanceof Error) {
        handleLedgerError({ error, network })
      }
      throw error
    }

    try {
      await LedgerService.openApp(LedgerAppType.SOLANA)
      // Now ensure Solana app is ready
      Logger.info('Ensuring Solana app is ready...')
      await LedgerService.waitForApp(
        LedgerAppType.SOLANA,
        LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
      )
      Logger.info('Solana app is ready')
    } catch (error) {
      Logger.error('Failed to detect Solana app:', error)
      if (error instanceof Error) {
        handleLedgerError({ error, network })
      }
      throw error
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
    const signer = await this.getEvmSigner({ provider, accountIndex })

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
}
