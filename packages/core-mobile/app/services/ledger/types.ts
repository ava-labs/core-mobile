import { Curve } from 'utils/publicKeys'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { BtcWalletPolicyDetails } from '@avalabs/vm-module-types'
import { PrimaryAccount } from 'store/account'
import { WalletType } from 'services/wallet/types'

// ============================================================================
// LEDGER APP TYPES
// ============================================================================

export enum LedgerAppType {
  AVALANCHE = 'Avalanche',
  SOLANA = 'Solana',
  ETHEREUM = 'Ethereum',
  BITCOIN = 'Bitcoin',
  BITCOIN_RECOVERY = 'Bitcoin Recovery',
  UNKNOWN = 'Unknown'
}

export interface AppInfo {
  applicationName: string
  version: string
}

// ============================================================================
// LEDGER RESPONSE CODES
// ============================================================================

export const LedgerReturnCode = {
  SUCCESS: 0x9000,
  USER_REJECTED: 0x6985,
  APP_NOT_OPEN: 0x6a80,
  DEVICE_LOCKED: 0x5515,
  INVALID_PARAMETER: 0x6b00,
  COMMAND_NOT_ALLOWED: 0x6986
} as const

export enum LEDGER_ERROR_CODES {
  WRONG_APP = '0x6a80',
  COMMUNICATION_ERROR = '0x6511',
  REJECTED = '0x6985',
  REJECTED_ALT = '0x6986',
  NOT_READY = '0x6a86',
  DEVICE_LOCKED = '0x5515',
  UPDATE_REQUIRED = '0x6e00',
  USER_CANCELLED = 'user_cancelled',
  DISCONNECTED_DEVICE = 'disconnecteddevice',
  TRANSPORT_RACE_CONDITION = 'transportracecondition',
  TRANSPORT_RACE_CONDITION_ALT = 'an action was already pending on the ledger device',
  BLIND_SIGNATURE = 'blind',
  BLUETOOTH_PERMISSION = 'ledger_bluetooth_permission_required',
  BLUETOOTH_RADIO_OFF = 'ledger_bluetooth_radio_off',
  BLUETOOTH_UNSUPPORTED = 'ledger_bluetooth_unsupported',
  BLUETOOTH_UNKNOWN = 'ledger_bluetooth_unknown',
  TRANSPORT_INTERFACE_NOT_AVAILABLE = 'transport_interface_not_available',
  // Avalanche app returns a bare 0x6984 (no review screen) when it cannot
  // clear-sign a foreign-EVM/L1 tx and blind signing is not enabled.
  // Unmapped by hw-app-avalanche and @ledgerhq → surfaces as UNKNOWN_ERROR.
  BLIND_SIGN_REQUIRED = '0x6984'
}

// Shown when an Avalanche-app transaction is rejected with a bare 0x6984
// (blind-sign refusal). Kept soft: 0x6984 is the generic "invalid data" word,
// so guide toward the fix without asserting it is the only cause.
export const LEDGER_BLIND_SIGN_MESSAGE =
  'This transaction likely needs blind signing enabled in the Avalanche app ' +
  'on your Ledger. Open the app’s Settings, turn on Blind signing, and try ' +
  'again. If you don’t see that setting, update the Avalanche app in Ledger Live.'

// ============================================================================
// LEDGER DEVICE TYPES
// ============================================================================

export interface LedgerDevice {
  id: string
  name: string
  rssi?: number
}

export interface LedgerTransportState {
  available: boolean
  powered: boolean
  device?: LedgerDevice
}

// ============================================================================
// CRYPTOGRAPHIC KEY TYPES
// ============================================================================

export interface PublicKey extends PublicKeyInfo {
  btcWalletPolicy?: BtcWalletPolicyDetails
}

export interface PublicKeyInfo {
  key: string
  derivationPath: string
  curve: Curve
}

export interface ExtendedPublicKey {
  path: string
  key: string
  chainCode: string
}

export enum LedgerAddressType {
  EVM = 'evm',
  AVALANCHE_X = 'avalanche-x',
  AVALANCHE_P = 'avalanche-p',
  AVALANCHE_CORE_ETH = 'avalanche-core-eth',
  BITCOIN = 'bitcoin',
  SOLANA = 'solana'
}

export interface AddressInfo {
  id: string
  type: LedgerAddressType
  address: string
  derivationPath: string
}

// ============================================================================
// LEDGER WALLET DERIVATION TYPES
// ============================================================================

export enum LedgerDerivationPathType {
  BIP44 = 'BIP44',
  LedgerLive = 'LedgerLive'
}

// ============================================================================
// LEDGER KEYS MANAGEMENT
// ============================================================================

export interface AvalancheKey {
  addresses: {
    evm: string
    avm: string
    pvm: string
    coreEth: string // C-chain bech32 format (C-avax1... or C-fuji1...)
    btc: string // Bitcoin address
  }
  xpubs: {
    evm: string
    avalanche: string
  }
  publicKeys: PublicKeyInfo[]
}

export interface LedgerKeys {
  solanaKeys?: PublicKeyInfo[]
  avalancheKeys?: AvalancheKey
}

export type LedgerKeysByNetwork = {
  mainnet: LedgerKeys
  testnet: LedgerKeys
}

// ============================================================================
// WALLET SETUP AND CREATION TYPES
// ============================================================================

export interface SetupProgress {
  currentStep: string
  progress: number
  totalSteps: number
  estimatedTimeRemaining?: number
}

export interface WalletCreationOptions {
  deviceId: string
  deviceName?: string
  derivationPathType: LedgerDerivationPathType
  accountCount?: number
}

export interface WalletUpdateOptions extends WalletCreationOptions {
  walletId: string
  walletName: string
  walletType: WalletType
  accountIndexToUse: number
}

export interface WalletUpdateSolanaOptions {
  deviceId: string
  walletId: string
  walletName: string
  walletType: WalletType
  account: PrimaryAccount
  solanaKeys: PublicKeyInfo[]
}

// ============================================================================
// WALLET SECRET BUILDING TYPES
// ============================================================================

export const WalletSecretOperation = {
  NEW: 'new',
  UPDATE: 'update',
  SOLANA_UPDATE: 'solana-update'
} as const

interface BaseWalletSecretParams {
  deviceId: string
  deviceName: string
  derivationPathType: LedgerDerivationPathType
}

export interface NewWalletSecretParams extends BaseWalletSecretParams {
  type: typeof WalletSecretOperation.NEW
  extendedPublicKeys?: Record<number, { evm: string; avalanche: string }>
  publicKeys: Record<number, PublicKeyInfo[]>
  solanaAddresses?: Record<number, string>
}

export interface UpdateWalletSecretParams extends BaseWalletSecretParams {
  type: typeof WalletSecretOperation.UPDATE
  existingWalletSecret: Record<string, unknown>
  accountIndex: number
  newXpubs?: { evm: string; avalanche: string }
  newPublicKeys: PublicKeyInfo[]
  newSolanaKeys?: PublicKeyInfo[]
}

export interface SolanaUpdateSecretParams extends BaseWalletSecretParams {
  type: typeof WalletSecretOperation.SOLANA_UPDATE
  existingWalletSecret: Record<string, unknown>
  accountIndex: number
  newSolanaKeys: PublicKeyInfo[]
}

export type WalletSecretParams =
  | NewWalletSecretParams
  | UpdateWalletSecretParams
  | SolanaUpdateSecretParams

// ============================================================================
// LEDGER WALLET DATA TYPES
// ============================================================================

// Base interface for common wallet data
interface BaseLedgerWalletData {
  deviceId: string
  transport?: TransportBLE // Optional for backward compatibility
  publicKeys: PerAccountPublicKeys
}

// Per-account extended public keys format
export interface PerAccountExtendedPublicKeys {
  [accountIndex: number]: {
    evm: string
    avalanche: string
  }
}

// Per-account public keys format
export interface PerAccountPublicKeys {
  [accountIndex: number]: Array<PublicKey>
}

// BIP44 specific wallet data
export interface BIP44LedgerWalletData extends BaseLedgerWalletData {
  derivationPathSpec: LedgerDerivationPathType.BIP44
  // Extended keys required for BIP44 - stored per account
  extendedPublicKeys: PerAccountExtendedPublicKeys
}

// Ledger Live specific wallet data
export interface LedgerLiveWalletData extends BaseLedgerWalletData {
  derivationPathSpec: LedgerDerivationPathType.LedgerLive
  // No extended keys for Ledger Live
  extendedPublicKeys?: never
}

// Union type for all possible Ledger wallet data
export type LedgerWalletData = BIP44LedgerWalletData | LedgerLiveWalletData

// ============================================================================
// LEDGER ACCOUNT DISCOVERY
// ============================================================================

/** Maximum number of account indices to derive during Ledger import discovery */
export const MAX_LEDGER_DISCOVERY_ACCOUNTS = 10

/**
 * Keys for multiple account indices, keyed by account index.
 * Used during Ledger import to hold derived keys before activity checking.
 */
export type LedgerMultiIndexKeys = {
  mainnet: { [accountIndex: number]: LedgerKeys }
  testnet: { [accountIndex: number]: LedgerKeys }
}
