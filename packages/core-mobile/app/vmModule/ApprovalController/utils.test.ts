import { NetworkVMType } from '@avalabs/vm-module-types'
import { showAlert } from '@avalabs/k2-alpine'
import { Network } from '@avalabs/core-chains-sdk'
import LedgerService from 'services/ledger/LedgerService'
import { LedgerAppType, LEDGER_BLIND_SIGN_MESSAGE } from 'services/ledger/types'
import { handleLedgerErrorAndShowAlert } from './utils'

jest.mock('@avalabs/k2-alpine', () => ({ showAlert: jest.fn() }))
jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: { getCurrentAppVersion: jest.fn(), getCurrentAppType: jest.fn() }
}))

const mockShowAlert = showAlert as jest.Mock
const mockLedger = LedgerService as unknown as {
  getCurrentAppVersion: jest.Mock
  getCurrentAppType: jest.Mock
}

// Orange-style Avalanche L1: EVM VM + a subnetId → getLedgerAppName → AVALANCHE
const l1Network = {
  vmName: NetworkVMType.EVM,
  subnetId: 'orange-subnet',
  chainId: 999999
} as unknown as Network

// Plain Ethereum mainnet: EVM VM, NO subnetId → getLedgerAppName → ETHEREUM
const ethereumNetwork = {
  vmName: NetworkVMType.EVM,
  chainId: 1
} as unknown as Network

beforeEach(() => {
  jest.clearAllMocks()
  mockLedger.getCurrentAppVersion.mockReturnValue('1.4.4')
  mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.AVALANCHE)
})

describe('handleLedgerErrorAndShowAlert — 0x6984 on Avalanche L1', () => {
  it('shows the blind-sign guidance instead of the raw UNKNOWN_ERROR', () => {
    handleLedgerErrorAndShowAlert({
      error: { message: 'Ledger device: UNKNOWN_ERROR (0x6984)' } as never,
      network: l1Network,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.title).toBe('Enable blind signing')
    expect(arg.description).toBe(LEDGER_BLIND_SIGN_MESSAGE)
  })

  it('does NOT show blind-sign guidance for a non-Avalanche (Ethereum) app', () => {
    mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.ETHEREUM)

    handleLedgerErrorAndShowAlert({
      error: { message: 'Ledger device: UNKNOWN_ERROR (0x6984)' } as never,
      network: ethereumNetwork,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.title).not.toBe('Enable blind signing')
    expect(arg.description).toBe('Ledger device: UNKNOWN_ERROR (0x6984)')
  })

  it('does NOT show blind-sign guidance when the expected app is Avalanche but a different app is open', () => {
    // Avalanche L1 network (getLedgerAppName → AVALANCHE) but the detected
    // open app is Ethereum — 0x6984 here is a generic status word from
    // another app, not the Avalanche blind-signing prompt.
    mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.ETHEREUM)

    handleLedgerErrorAndShowAlert({
      error: { message: 'Ledger device: UNKNOWN_ERROR (0x6984)' } as never,
      network: l1Network,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.title).not.toBe('Enable blind signing')
    expect(arg.description).toBe('Ledger device: UNKNOWN_ERROR (0x6984)')
  })
})
