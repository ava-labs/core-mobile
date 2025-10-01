import { Curve } from 'utils/publicKeys'
import { LedgerDerivationPathType } from 'services/wallet/LedgerWallet'

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

