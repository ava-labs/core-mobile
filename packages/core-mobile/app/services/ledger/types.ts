import { Curve } from 'utils/publicKeys'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'
import { BtcWalletPolicyDetails } from '@avalabs/vm-module-types'

// ============================================================================
// LEDGER APP TYPES
// ============================================================================

export enum LedgerAppType {
  AVALANCHE = 'Avalanche',
  SOLANA = 'Solana',
  ETHEREUM = 'Ethereum',
  BITCOIN = 'Bitcoin',
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

export const LEDGER_ERROR_CODES = {
  WRONG_APP: '0x6a80',
  REJECTED: '0x6985',
  REJECTED_ALT: '0x6986',
  NOT_READY: '0x6a86',
  DEVICE_LOCKED: '0x5515',
  UPDATE_REQUIRED: '0x6e00',
  USER_CANCELLED: 'user_cancelled',
  DISCONNECTED_DEVICE: 'disconnecteddevice'
} as const

export type LedgerReturnCodeType =
  typeof LedgerReturnCode[keyof typeof LedgerReturnCode]

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

export interface AddressInfo {
  id: string
  address: string
  derivationPath: string
  network: string
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
  }
  xpubs: {
    evm: string
    avalanche: string
  }
}

export interface LedgerKeys {
  solanaKeys?: PublicKeyInfo[]
  avalancheKeys?: AvalancheKey
  bitcoinAddress?: string
  xpAddress?: string
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
  derivationPathType?: LedgerDerivationPathType
  accountCount?: number
  individualKeys?: PublicKeyInfo[]
}

// ============================================================================
// LEDGER WALLET DATA TYPES
// ============================================================================

// Base interface for common wallet data
interface BaseLedgerWalletData {
  deviceId: string
  vmType: NetworkVMType
  transport?: TransportBLE // Optional for backward compatibility
  publicKeys: PublicKey[]
}

// BIP44 specific wallet data
export interface BIP44LedgerWalletData extends BaseLedgerWalletData {
  derivationPathSpec: LedgerDerivationPathType.BIP44
  derivationPath: string
  // Extended keys required for BIP44 - supports both legacy (string) and new (ExtendedPublicKey) formats
  extendedPublicKeys:
    | {
        evm: string
        avalanche: string
      }
    | ExtendedPublicKey[]
}

// Ledger Live specific wallet data
export interface LedgerLiveWalletData extends BaseLedgerWalletData {
  derivationPathSpec: LedgerDerivationPathType.LedgerLive
  derivationPath: string
  // No extended keys for Ledger Live
  extendedPublicKeys?: never
}

// Union type for all possible Ledger wallet data
export type LedgerWalletData = BIP44LedgerWalletData | LedgerLiveWalletData
