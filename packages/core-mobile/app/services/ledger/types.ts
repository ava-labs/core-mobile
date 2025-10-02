import { Curve } from 'utils/publicKeys'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

// ============================================================================
// LEDGER APP TYPES
// ============================================================================

export enum LedgerAppType {
  AVALANCHE = 'Avalanche',
  SOLANA = 'Solana',
  ETHEREUM = 'Ethereum',
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

export interface PublicKeyInfo {
  key: string
  derivationPath: string
  curve: 'secp256k1' | 'ed25519'
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

export interface LedgerKeys {
  solanaKeys: Array<{
    key: string
    derivationPath: string
    curve: Curve
  }>
  avalancheKeys: {
    evm: string
    avalanche: string
    pvm: string
  } | null
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
  individualKeys?: Array<{
    key: string
    derivationPath: string
    curve: Curve
  }>
}

// ============================================================================
// LEDGER WALLET DATA TYPES
// ============================================================================

// Base interface for common wallet data
interface BaseLedgerWalletData {
  deviceId: string
  vmType: NetworkVMType
  transport?: TransportBLE // Optional for backward compatibility
  publicKeys: Array<{
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
}

// BIP44 specific wallet data
export interface BIP44LedgerWalletData extends BaseLedgerWalletData {
  derivationPathSpec: LedgerDerivationPathType.BIP44
  derivationPath: string
  // Extended keys required for BIP44
  extendedPublicKeys: {
    evm: string
    avalanche: string
  }
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
