import {
  Avalanche,
  BitcoinLedgerWallet,
  BitcoinProvider,
  getEvmAddressFromPubKey,
  getBtcAddressFromPubKey,
  BitcoinProviderAbstract,
  LedgerSigner,
  DerivationPath,
  createWalletPolicy,
  SolanaLedgerSigner
} from '@avalabs/core-wallets-sdk'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import { JsonRpcBatchInternal, SolanaProvider } from '@avalabs/core-wallets-sdk'
import {
  RpcMethod,
  TypedData,
  MessageTypes,
  BtcWalletPolicyDetails
} from '@avalabs/vm-module-types'
import { networks } from 'bitcoinjs-lib'
import { Transaction, TransactionRequest } from 'ethers'
import { getBitcoinProvider } from 'services/network/utils/providerUtils'
import LedgerService from 'services/ledger/LedgerService'
import BiometricsSDK from 'utils/BiometricsSDK'
import {
  LedgerAddressType,
  LedgerAppType,
  LedgerDerivationPathType,
  LedgerWalletData,
  PerAccountExtendedPublicKeys,
  PerAccountPublicKeys
} from 'services/ledger/types'
import { LEDGER_TIMEOUTS } from 'new/features/ledger/consts'
import { bip32, extendedPublicKeyToXpub } from 'utils/bip32'
import Logger from 'utils/Logger'
import {
  Curve,
  EVM_BASE_DERIVATION_PATH_PREFIX,
  AVALANCHE_DERIVATION_PATH_PREFIX
} from 'utils/publicKeys'
import { Account } from 'store/account'
import { uuid } from 'utils/uuid'
import { CoreAccountType } from '@avalabs/types'
import { toSegments } from 'utils/toSegments'
import {
  DeviceActionStatus,
  type DeviceManagementKit,
  type DeviceSessionId
} from '@ledgerhq/device-management-kit'
import { SignerBtcBuilder } from '@ledgerhq/device-signer-kit-bitcoin'
import { firstValueFrom } from 'rxjs'
import { toUtf8 } from 'ethereumjs-util'
import { BitcoinWalletPolicyService } from './BitcoinWalletPolicyService'
import {
  Wallet,
  AvalancheTransactionRequest,
  BtcTransactionRequest,
  SolanaTransactionRequest,
  MessageSigningRequest
} from './types'
import { getAddressDerivationPath, handleLedgerError } from './utils'

export class LedgerWallet implements Wallet {
  private derivationPathSpec: LedgerDerivationPathType
  private extendedPublicKeys?: PerAccountExtendedPublicKeys
  private publicKeys: PerAccountPublicKeys
  private walletId: string

  constructor(ledgerData: LedgerWalletData & { walletId: string }) {
    this.derivationPathSpec = ledgerData.derivationPathSpec
    this.publicKeys = ledgerData.publicKeys
    this.walletId = ledgerData.walletId

    // For BIP44 wallets, store extended public keys (per-account format)
    // For Ledger Live, extendedPublicKeys remains undefined
    if (ledgerData.derivationPathSpec === LedgerDerivationPathType.BIP44) {
      this.extendedPublicKeys = ledgerData.extendedPublicKeys
    }
  }

  private async getTransport(): Promise<{
    dmk: DeviceManagementKit
    sessionId: DeviceSessionId
  }> {
    Logger.info('getTransport called - using LedgerService.ensureConnection')
    return LedgerService.ensureConnection()
  }

  private async getBitcoinSigner(
    accountIndex = 0,
    bitcoinProvider: BitcoinProviderAbstract,
    network: Network
  ): Promise<BitcoinLedgerWallet> {
    try {
      const publicKeys = this.publicKeys[accountIndex]

      if (!publicKeys) {
        Logger.error(`Public key not found for account index ${accountIndex}`)
        throw new Error(
          `Public key not found for account index ${accountIndex}`
        )
      }
      const evmPubKey = BitcoinWalletPolicyService.getEvmPublicKey(
        publicKeys,
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
          publicKeys,
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

      const wallet = new BitcoinLedgerWallet(
        addressNode.publicKey,
        evmPubKey.derivationPath,
        bitcoinProvider,
        transport.dmk,
        transport.sessionId,
        walletPolicyDetails
      )

      Logger.info('BitcoinLedgerWallet created successfully')
      return wallet
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

  public async signMessage({
    signingData,
    accountIndex,
    network,
    provider
  }: {
    signingData: MessageSigningRequest
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal | Avalanche.JsonRpcProvider
  }): Promise<string> {
    switch (signingData.type) {
      case RpcMethod.SOLANA_SIGN_MESSAGE:
        return this.signSolanaMessage()

      case RpcMethod.AVALANCHE_SIGN_MESSAGE: {
        if (!(provider instanceof Avalanche.JsonRpcProvider)) {
          throw new Error(
            'Avalanche provider is required for Avalanche message signing'
          )
        }
        return this.signAvalancheMessage(
          accountIndex,
          signingData.data,
          provider
        )
      }

      case RpcMethod.ETH_SIGN:
      case RpcMethod.PERSONAL_SIGN:
      case RpcMethod.SIGN_TYPED_DATA:
      case RpcMethod.SIGN_TYPED_DATA_V1:
      case RpcMethod.SIGN_TYPED_DATA_V3:
      case RpcMethod.SIGN_TYPED_DATA_V4:
        if (!(provider instanceof JsonRpcBatchInternal)) {
          throw new Error(
            'Ethereum provider is required for Ethereum message signing'
          )
        }
        return this.signEvmMessage({
          signingData,
          accountIndex,
          network,
          provider
        })

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
      const { dmk, sessionId } = await this.getTransport()

      // Ensure Bitcoin app is ready
      Logger.info('Ensuring Bitcoin app is ready...')
      await LedgerService.waitForApp(
        LedgerAppType.BITCOIN,
        LEDGER_TIMEOUTS.APP_WAIT_TIMEOUT
      )

      const btcApp = new SignerBtcBuilder({ dmk, sessionId }).build()

      // Get master fingerprint from device
      const masterFprRequest = await btcApp.getMasterFingerprint()
      const masterFpr = await firstValueFrom(masterFprRequest.observable)

      if (masterFpr.status !== DeviceActionStatus.Completed) {
        throw new Error('Failed to get master fingerprint')
      }

      // Get EVM derivation path for this account
      const derivationPath = `44'/60'/${accountIndex}'`

      Logger.info(
        'Getting extended public key from device at path:',
        derivationPath
      )

      // Get extended public key from device
      const xpubRequest = await btcApp.getExtendedPublicKey(derivationPath, {
        returnChainCode: true
      })
      const xpub = await firstValueFrom(xpubRequest.observable)

      if (xpub.status !== DeviceActionStatus.Completed) {
        throw new Error('Failed to get master fingerprint')
      }

      Logger.info('Extended public key retrieved')

      // Note: We use WalletPolicy (not DefaultWalletPolicy) because we need a named policy for registration
      const policyName = `Core - ${accountName}`
      const walletPolicy = createWalletPolicy(
        Buffer.from(masterFpr.output.masterFingerprint).toString('hex'),
        accountIndex,
        xpub.output.extendedPublicKey,
        policyName
      )

      Logger.info('Created wallet policy for registration')

      // Register the policy with the device
      Logger.info('Registering policy with Ledger device...')
      const walletRegistrationRequest = await btcApp.registerWallet(
        walletPolicy
      )
      const walletRegistration = await firstValueFrom(
        walletRegistrationRequest.observable
      )

      if (walletRegistration.status !== DeviceActionStatus.Completed) {
        throw new Error('Failed to register wallet')
      }

      Logger.info('Wallet policy registered successfully:', {
        policyName: walletRegistration.output.name,
        policyHmacLength: walletRegistration.output.hmac.length
      })

      // Store the policy details in wallet data
      const policyDetails: BtcWalletPolicyDetails = {
        hmacHex: Buffer.from(walletRegistration.output.hmac).toString('hex'),
        masterFingerprint: Buffer.from(
          masterFpr.output.masterFingerprint
        ).toString('hex'),
        xpub: xpub.output.extendedPublicKey,
        name: policyName
      }

      const publicKeys = this.publicKeys[accountIndex]

      if (!publicKeys) {
        throw new Error(
          `Public keys not found for account index ${accountIndex}`
        )
      }

      const stored = await BitcoinWalletPolicyService.storeBtcWalletPolicy({
        walletId,
        publicKeys,
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
    const publicKeys = this.publicKeys[accountIndex]

    if (!publicKeys) {
      throw new Error(`Public keys not found for account index ${accountIndex}`)
    }
    // Check if wallet policy is registered for this specific account
    const needsRegistration =
      BitcoinWalletPolicyService.needsBtcWalletPolicyRegistration(
        publicKeys,
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
    provider: provider
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
    network: Network
    provider: Avalanche.JsonRpcProvider
  }): Promise<string> {
    Logger.info('signAvalancheTransaction called')
    const appType = LedgerAppType.AVALANCHE
    const { dmk, sessionId } = await this.handleAppConnection(appType)

    const signer = new Avalanche.SimpleLedgerSigner(
      accountIndex,
      provider,
      this.getExtendedPublicKeyFor(NetworkVMType.PVM, accountIndex)?.key,
      this.isBIP44() ? DerivationPath.BIP44 : DerivationPath.LedgerLive
    )

    Logger.info('Calling avaxApp.sign...')
    try {
      const signedTx = await signer.signTx({
        ...transaction,
        dmk,
        sessionId
      })

      Logger.info('signAvalancheTransaction completed successfully')
      return JSON.stringify(signedTx.toJSON())
    } catch (signError) {
      Logger.error('avaxApp.sign failed with error:', signError)
      if (signError instanceof Error) {
        handleLedgerError({ error: signError, appType })
      }
      throw signError
    }
  }

  public async signEvmTransaction({
    accountIndex,
    transaction,
    network,
    provider: provider
  }: {
    accountIndex: number
    transaction: TransactionRequest
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    Logger.info('signEvmTransaction called')

    const chainId = transaction.chainId
      ? Number(transaction.chainId)
      : network.chainId

    const { dmk, sessionId } = await this.handleAppConnection(
      LedgerAppType.AVALANCHE
    )

    try {
      // Get the derivation path for this account
      const derivationPath = this.getDerivationPath(
        accountIndex,
        NetworkVMType.EVM
      )
      Logger.info('Using derivation path:', derivationPath)

      const signer = new LedgerSigner(
        accountIndex,
        dmk,
        sessionId,
        this.isBIP44() ? DerivationPath.BIP44 : DerivationPath.LedgerLive,
        provider
      )

      const tx = {
        type: 2,
        chainId,
        nonce: transaction.nonce || 0,
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
        gasLimit: transaction.gasLimit || 0,
        to: transaction.to?.toString() || '0x',
        value: transaction.value || 0,
        data: transaction.data || '0x',
        accessList: transaction.accessList ?? []
      }

      Logger.info('Transaction data:', tx)

      // Serialize as EIP-1559 transaction (type 2)
      // unsignedSerialized = '0x' + '02' + RLP([...fields])
      // slice(2) removes the '0x' prefix, preserving the '02' type byte for Ledger
      const serializedTx = Transaction.from(tx).unsignedSerialized
      const unsignedTx = serializedTx.slice(2)
      Logger.info('Full serialized transaction:', serializedTx)
      Logger.info('Unsigned transaction hex:', unsignedTx)

      const signedTx = await signer.signTransaction(tx)

      Logger.info('Successfully signed transaction')
      return signedTx
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
    network
  }: {
    accountIndex: number
    transaction: SolanaTransactionRequest
    network: Network
    provider: SolanaProvider
  }): Promise<string> {
    const { dmk, sessionId } = await this.handleAppConnection(
      LedgerAppType.SOLANA
    )

    const signer = new SolanaLedgerSigner(accountIndex, dmk, sessionId)
    Logger.info('Created Solana signer')

    try {
      Logger.info('Signing transaction with Ledger')
      const signResult = signer.signTx(
        transaction.serializedTx,
        network.rpcUrl,
        !!network.isTestnet
      )
      Logger.info('Successfully signed transaction')
      return signResult
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

    // For BIP44 secp256k1 wallets, first try to derive the compressed public key from stored xpubs.
    // Historically, some legacy wallet secrets stored EVM/AVM addresses in `publicKeys` instead of raw
    // compressed public keys, so we rely on `extendedPublicKeys` (xpubs) to recover the actual pubkey
    // when available. Newer flows (e.g. LedgerService.getAvalancheKeys → useLedgerWallet) store
    // compressed public key hex for EVM/AVM directly in `publicKeys`, so this xpub-based derivation is
    // primarily for backward compatibility with legacy BIP44 data.
    if (
      this.isBIP44() &&
      this.extendedPublicKeys &&
      curve === Curve.SECP256K1
    ) {
      const derived = this.derivePublicKeyFromXpub(derivationPath)
      if (derived !== undefined) {
        return derived
      }
    }

    const segments = toSegments(derivationPath, curve)
    const pubkey = this.publicKeys[segments.accountIndex]
    if (!pubkey) {
      throw new Error(
        `No public keys available for LedgerWallet at accountIndex ${segments.accountIndex} for derivation path ${derivationPath}`
      )
    }

    // Fallback: look up the stored value for this derivation path and curve.
    // This is used for ED25519/Solana keys and Ledger Live wallets, and for modern flows where
    // `publicKeys` already contains the compressed public key hex for EVM/AVM.
    const matchingPublicKey = pubkey.find(pk => {
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

  /**
   * Derives the compressed public key (hex) for a given BIP44 derivation path
   * by looking up the per-account xpub in extendedPublicKeys and deriving children.
   *
   * e.g. path "m/44'/60'/0'/0/0":
   *   - xpub is at extendedPublicKeys[0].evm  (account-level xpub at m/44'/60'/0')
   *   - child segments are [0, 0]
   */
  private derivePublicKeyFromXpub(derivationPath: string): string | undefined {
    if (!this.extendedPublicKeys) return undefined

    let xpub: string | undefined
    let childSegmentsStr: string | undefined

    if (derivationPath.startsWith(EVM_BASE_DERIVATION_PATH_PREFIX)) {
      // e.g. "m/44'/60'/0'/0/0" -> after prefix "0'/0/0"
      const afterPrefix = derivationPath.slice(
        EVM_BASE_DERIVATION_PATH_PREFIX.length
      )
      const parts = afterPrefix.split('/')
      const accountIndex = parseInt(parts[0]?.replace(/'$/, '') ?? '', 10)
      if (isNaN(accountIndex)) return undefined
      xpub = this.extendedPublicKeys[accountIndex]?.evm
      childSegmentsStr = parts.slice(1).join('/') // "0/0"
    } else if (derivationPath.startsWith(AVALANCHE_DERIVATION_PATH_PREFIX)) {
      // e.g. "m/44'/9000'/0'/0/0" -> after prefix "0'/0/0"
      const afterPrefix = derivationPath.slice(
        AVALANCHE_DERIVATION_PATH_PREFIX.length
      )
      const parts = afterPrefix.split('/')
      const accountIndex = parseInt(parts[0]?.replace(/'$/, '') ?? '', 10)
      if (isNaN(accountIndex)) return undefined
      xpub = this.extendedPublicKeys[accountIndex]?.avalanche
      childSegmentsStr = parts.slice(1).join('/')
    }

    if (!xpub || !childSegmentsStr) return undefined

    try {
      let node = bip32.fromBase58(xpub)
      for (const segment of childSegmentsStr.split('/')) {
        const index = parseInt(segment, 10)
        if (isNaN(index)) return undefined
        node = node.derive(index)
      }
      return node.publicKey.toString('hex')
    } catch (error) {
      Logger.error('LedgerWallet: failed to derive public key from xpub', error)
      return undefined
    }
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
    data: unknown,
    provider: Avalanche.JsonRpcProvider
  ): Promise<string> {
    Logger.info('signAvalancheMessage called')
    const { dmk, sessionId } = await this.handleAppConnection(
      LedgerAppType.AVALANCHE
    )

    try {
      const signer = new Avalanche.SimpleLedgerSigner(
        accountIndex,
        provider,
        this.getExtendedPublicKeyFor(NetworkVMType.PVM, accountIndex)?.key,
        this.isBIP44() ? DerivationPath.BIP44 : DerivationPath.LedgerLive
      )

      Logger.info('Signing message with AppAvax.signMsg')
      // Sign the message using the Avalanche app
      const signResult = await signer.signMessage({
        message: toUtf8(typeof data === 'string' ? data : JSON.stringify(data)),
        chain: 'X',
        dmk,
        sessionId
      })

      Logger.info('Successfully signed Avalanche message')
      return signResult.toString('hex')
    } catch (error) {
      Logger.error('Failed to sign Avalanche message:', error)
      if (error instanceof Error) {
        handleLedgerError({ error, appType: LedgerAppType.AVALANCHE })
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
    const collectDependencies = (typeName: string): void => {
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

  private validateTypedData(typedData: TypedData<MessageTypes>): void {
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

  private async parseTypedDataRequest(
    signingData: MessageSigningRequest
  ): Promise<TypedData<MessageTypes>> {
    // Check if this is EIP-712 v1 format (array of {name, type, value})
    const isV1Format =
      Array.isArray(signingData.data) ||
      (typeof signingData.data === 'string' &&
        signingData.data.trim().startsWith('['))

    if (isV1Format || signingData.type === RpcMethod.SIGN_TYPED_DATA_V1) {
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
    if (typeof signingData.data === 'string') {
      try {
        typedData = JSON.parse(signingData.data) as TypedData<MessageTypes>
        Logger.info('Parsed typed data from string')
      } catch (parseError) {
        Logger.error('Failed to parse typed data string:', parseError)
        throw new Error(
          'Invalid typed data format: expected JSON string or object'
        )
      }
    } else {
      typedData = signingData.data as TypedData<MessageTypes>
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

    return eip712Message
  }

  private async signEvmMessage({
    signingData,
    accountIndex,
    network,
    provider
  }: {
    signingData: MessageSigningRequest
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string> {
    const { dmk, sessionId } = await this.getTransport()

    const ledgerSigner = new LedgerSigner(
      accountIndex,
      dmk,
      sessionId,
      this.derivationPathSpec === LedgerDerivationPathType.BIP44
        ? DerivationPath.BIP44
        : DerivationPath.LedgerLive,
      provider
    )
    try {
      if (
        [
          RpcMethod.SIGN_TYPED_DATA,
          RpcMethod.SIGN_TYPED_DATA_V1,
          RpcMethod.SIGN_TYPED_DATA_V3,
          RpcMethod.SIGN_TYPED_DATA_V4
        ].includes(signingData.type)
      ) {
        const parsedTypedData = await this.parseTypedDataRequest(signingData)
        return ledgerSigner.signTypedData(
          parsedTypedData.domain,
          parsedTypedData.types,
          parsedTypedData.message
        )
      } else if (
        signingData.type === RpcMethod.ETH_SIGN ||
        signingData.type === RpcMethod.PERSONAL_SIGN
      ) {
        return ledgerSigner.signMessage(signingData.data)
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

    const addresses = await LedgerService.getAllAddresses(
      index,
      1,
      isTestnet,
      this.derivationPathSpec
    )
    const findAddress = (type: LedgerAddressType): string | undefined =>
      addresses.find(addr => addr.type === type)?.address

    const addressC = findAddress(LedgerAddressType.EVM)
    const addressAVM = findAddress(LedgerAddressType.AVALANCHE_X)
    const addressPVM = findAddress(LedgerAddressType.AVALANCHE_P)
    const addressCoreEth = findAddress(LedgerAddressType.AVALANCHE_CORE_ETH)
    const addressBTC = findAddress(LedgerAddressType.BITCOIN)

    if (
      !addressC ||
      !addressAVM ||
      !addressPVM ||
      !addressCoreEth ||
      !addressBTC
    ) {
      throw new Error('Failed to derive all addresses from Ledger')
    }

    let xpub = { evm: '', avalanche: '' }
    // Get extended public keys for this account (device is already connected)
    if (this.isBIP44()) {
      const extendedKeys = await LedgerService.getExtendedPublicKeys(
        index,
        this.derivationPathSpec
      )
      xpub = {
        evm: extendedPublicKeyToXpub(
          extendedKeys.evm.key,
          extendedKeys.evm.chainCode
        ),
        avalanche: extendedPublicKeyToXpub(
          extendedKeys.avalanche.key,
          extendedKeys.avalanche.chainCode
        )
      }
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

  private handleAppConnection = async (
    appType: LedgerAppType
  ): Promise<TransportBLE> => {
    // First ensure we're connected to the device. ensureConnection
    // reconnects the BLE transport if it went idle between signings —
    // this is the safety net multi-step signing flows rely on.
    Logger.info('Ensuring connection to Ledger device...')
    let transport: TransportBLE
    try {
      transport = await LedgerService.ensureConnection()
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
}
