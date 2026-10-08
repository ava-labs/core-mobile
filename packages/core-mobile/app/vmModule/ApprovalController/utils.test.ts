import { showAlert } from '@avalabs/k2-alpine'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
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

// Bitcoin mainnet → getLedgerAppName → BITCOIN
const bitcoinNetwork = {
  vmName: NetworkVMType.BITCOIN,
  chainId: 4503599627370475
} as unknown as Network

const wrongAppError = { message: 'Ledger device: (0x6a80)' } as never

beforeEach(() => {
  jest.clearAllMocks()
  mockLedger.getCurrentAppVersion.mockReturnValue('1.4.4')
  mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.AVALANCHE)
})

describe('handleLedgerErrorAndShowAlert — Avalanche blind-sign guidance', () => {
  it('shows the blind-sign title for the transformed message the real send/swap flow delivers', () => {
    // Real Avalanche L1 (foreign-EVM) path: signEvmTransaction's catch runs the
    // throw-side handleLedgerError first, which rewrites the raw 0x6984 into
    // LEDGER_BLIND_SIGN_MESSAGE; ethSendTransaction then re-wraps that as
    // rpcErrors.internal({ data: { cause } }). That transformed message — not a
    // raw 0x6984 — is what actually reaches this handler in production.
    handleLedgerErrorAndShowAlert({
      error: {
        data: { cause: { message: LEDGER_BLIND_SIGN_MESSAGE } }
      } as never,
      network: l1Network,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    expect(mockShowAlert).toHaveBeenCalledTimes(1)
    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.title).toBe('Enable blind signing')
    expect(arg.description).toBe(LEDGER_BLIND_SIGN_MESSAGE)
  })

  it('does NOT relabel a bare 0x6984 that never went through the throw-side', () => {
    // A raw 0x6984 that reaches the alert without being transformed (e.g. a
    // generic status word from another flow) must keep the default handling —
    // only the transformed guidance message triggers the blind-sign title.
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
})

describe('handleLedgerErrorAndShowAlert — which Bitcoin app the user is sent to', () => {
  it('does not send the user to the Bitcoin app when Bitcoin Recovery is open', () => {
    mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.BITCOIN_RECOVERY)
    mockLedger.getCurrentAppVersion.mockReturnValue('2.4.3')

    handleLedgerErrorAndShowAlert({
      error: wrongAppError,
      network: bitcoinNetwork,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.description).toBe(
      'Switch to the Bitcoin Recovery app on your Ledger device to continue'
    )
  })

  it('sends the user to Bitcoin Recovery when the open Bitcoin app is out of range', () => {
    mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.BITCOIN)
    mockLedger.getCurrentAppVersion.mockReturnValue('2.5.0')

    handleLedgerErrorAndShowAlert({
      error: wrongAppError,
      network: bitcoinNetwork,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.description).toBe(
      'Switch to the Bitcoin Recovery app on your Ledger device to continue'
    )
  })

  it('keeps naming Bitcoin when no Bitcoin app is open and the installed version is unknown', () => {
    mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.UNKNOWN)
    mockLedger.getCurrentAppVersion.mockReturnValue('')

    handleLedgerErrorAndShowAlert({
      error: wrongAppError,
      network: bitcoinNetwork,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.description).toBe(
      'Switch to the Bitcoin app on your Ledger device to continue'
    )
  })

  it('keeps naming the in-range Bitcoin app that is already open', () => {
    mockLedger.getCurrentAppType.mockReturnValue(LedgerAppType.BITCOIN)
    mockLedger.getCurrentAppVersion.mockReturnValue('2.4.2')

    handleLedgerErrorAndShowAlert({
      error: wrongAppError,
      network: bitcoinNetwork,
      onRetry: jest.fn(),
      onCancel: jest.fn()
    })

    const arg = mockShowAlert.mock.calls[0][0]
    expect(arg.description).toBe(
      'Switch to the Bitcoin app on your Ledger device to continue'
    )
  })
})
