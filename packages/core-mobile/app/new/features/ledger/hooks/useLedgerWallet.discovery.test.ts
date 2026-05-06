import { renderHook, act } from '@testing-library/react-hooks'
import { useSelector, useDispatch } from 'react-redux'
import { LedgerDerivationPathType } from 'services/ledger/types'
import type { LedgerMultiIndexKeys } from 'services/ledger/types'
import { Curve } from 'utils/publicKeys'
import { useLedgerWallet } from './useLedgerWallet'

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockDispatch = jest.fn()
const mockSetLedgerWalletMap = jest.fn()
const mockShowSnackbar = jest.fn()

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn()
}))

jest.mock('store/wallet/thunks', () => ({
  storeWallet: jest.fn((_params: unknown) => ({
    type: 'wallet/storeWallet',
    payload: undefined
  }))
}))

jest.mock('store/wallet/slice', () => ({
  setActiveWallet: jest.fn((walletId: string) => ({
    type: 'wallet/setActiveWallet',
    payload: walletId
  }))
}))

jest.mock('store/account', () => ({
  setAccount: jest.fn((account: unknown) => ({
    type: 'account/setAccount',
    payload: account
  })),
  setActiveAccountId: jest.fn((id: string) => ({
    type: 'account/setActiveAccountId',
    payload: id
  })),
  selectActiveAccount: jest.fn(() => undefined),
  selectActiveAccountHasSolanaAddress: jest.fn(() => false)
}))

jest.mock('utils/uuid', () => ({
  uuid: jest.fn()
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

jest.mock('new/common/utils/toast', () => ({
  showSnackbar: jest.fn()
}))

jest.mock('utils/BiometricsSDK', () => ({
  __esModule: true,
  default: {
    storeWalletSecret: jest.fn().mockResolvedValue(true),
    loadWalletSecret: jest.fn()
  }
}))

jest.mock('../store', () => ({
  useLedgerWalletMap: jest.fn()
}))

jest.mock('@ledgerhq/react-native-hw-transport-ble', () => ({
  __esModule: true,
  default: {
    observeState: jest.fn(() => ({
      unsubscribe: jest.fn()
    }))
  }
}))

jest.mock('store/posthog', () => ({
  selectIsLedgerSupportBlocked: jest.fn(() => true)
}))

jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: {
    connect: jest.fn(),
    getTransport: jest.fn(),
    disconnect: jest.fn()
  }
}))

// ─── Helpers ────────────────────────────────────────────────────────────────

let uuidCounter = 0

function resetUuidCounter(): void {
  uuidCounter = 0
}

function nextUuid(): string {
  uuidCounter += 1
  return `uuid-${uuidCounter}`
}

/**
 * Build a LedgerMultiIndexKeys fixture for the given account indices.
 * Each index gets deterministic addresses/xpubs/publicKeys so assertions
 * can verify per-account data is stored correctly.
 */
function buildMultiIndexKeys(indices: number[]): LedgerMultiIndexKeys {
  const mainnet: LedgerMultiIndexKeys['mainnet'] = {}
  const testnet: LedgerMultiIndexKeys['testnet'] = {}

  for (const idx of indices) {
    mainnet[idx] = {
      avalancheKeys: {
        addresses: {
          evm: `0xEVM_${idx}`,
          avm: `X-avax1_${idx}`,
          pvm: `P-avax1_${idx}`,
          coreEth: `C-avax1_${idx}`,
          btc: `bc1_${idx}`
        },
        xpubs: {
          evm: `xpub_evm_${idx}`,
          avalanche: `xpub_avalanche_${idx}`
        },
        publicKeys: [
          {
            key: `pk_mainnet_${idx}`,
            derivationPath: `m/44'/60'/0'/0/${idx}`,
            curve: Curve.SECP256K1
          }
        ]
      },
      solanaKeys: [
        {
          key: `sol_${idx}`,
          derivationPath: `m/44'/501'/${idx}'/0'`,
          curve: Curve.ED25519
        }
      ]
    }

    testnet[idx] = {
      avalancheKeys: {
        addresses: {
          evm: `0xEVM_TEST_${idx}`,
          avm: `X-fuji1_${idx}`,
          pvm: `P-fuji1_${idx}`,
          coreEth: `C-fuji1_${idx}`,
          btc: `tb1_${idx}`
        },
        xpubs: {
          evm: `xpub_evm_test_${idx}`,
          avalanche: `xpub_avalanche_test_${idx}`
        },
        publicKeys: [
          {
            key: `pk_testnet_${idx}`,
            derivationPath: `m/44'/60'/0'/0/${idx}`,
            curve: Curve.SECP256K1
          }
        ]
      }
    }
  }

  return { mainnet, testnet }
}

// ─── Test suite ─────────────────────────────────────────────────────────────

describe('useLedgerWallet - createLedgerWalletWithDiscovery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetUuidCounter()

    const { uuid } = require('utils/uuid')
    uuid.mockImplementation(nextUuid)

    // dispatch returns an object with unwrap() that resolves
    mockDispatch.mockImplementation(() => ({
      unwrap: jest.fn().mockResolvedValue(undefined)
    }))
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
    ;(useSelector as unknown as jest.Mock).mockReturnValue(false)

    const { useLedgerWalletMap } = require('../store')
    useLedgerWalletMap.mockReturnValue({
      setLedgerWalletMap: mockSetLedgerWalletMap,
      ledgerWalletMap: {},
      removeLedgerWallet: jest.fn(),
      resetLedgerWalletMap: jest.fn(),
      getLedgerInfoByWalletId: jest.fn()
    })

    const { showSnackbar } = require('new/common/utils/toast')
    mockShowSnackbar.mockReset()
    showSnackbar.mockImplementation(mockShowSnackbar)
  })

  it('creates accounts for all active indices', async () => {
    const { setAccount } = require('store/account')
    const activeIndices = [0, 1, 2]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)

    const { result } = renderHook(() => useLedgerWallet())

    let outcome:
      | {
          walletId: string
          createdAccounts: Array<{ accountId: string; accountIndex: number }>
        }
      | undefined

    await act(async () => {
      outcome = await result.current.createLedgerWalletWithDiscovery({
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        multiIndexKeys,
        activeIndices
      })
    })

    // One setAccount dispatch per active index
    expect(setAccount).toHaveBeenCalledTimes(3)

    // Return value contains all created accounts
    expect(outcome?.createdAccounts).toHaveLength(3)
    expect(outcome?.createdAccounts.map(a => a.accountIndex)).toEqual([0, 1, 2])
  })

  it('sets account 0 as the active account', async () => {
    const { setActiveAccountId } = require('store/account')
    const activeIndices = [0, 1]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)

    const { result } = renderHook(() => useLedgerWallet())

    await act(async () => {
      await result.current.createLedgerWalletWithDiscovery({
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        multiIndexKeys,
        activeIndices
      })
    })

    // setActiveAccountId should be called with the accountId for index 0.
    // uuid is called: 1st for walletId, 2nd for account index 0, 3rd for account index 1
    // So account 0's id is 'uuid-2'
    expect(setActiveAccountId).toHaveBeenCalledTimes(1)
    expect(setActiveAccountId).toHaveBeenCalledWith('uuid-2')
  })

  it('stores xpubs for all active indices in the wallet secret', async () => {
    const { storeWallet } = require('store/wallet/thunks')
    const activeIndices = [0, 2, 5]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)

    const { result } = renderHook(() => useLedgerWallet())

    await act(async () => {
      await result.current.createLedgerWalletWithDiscovery({
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        multiIndexKeys,
        activeIndices
      })
    })

    expect(storeWallet).toHaveBeenCalledTimes(1)

    const call = storeWallet.mock.calls[0][0]
    const walletSecret = JSON.parse(call.walletSecret)

    // extendedPublicKeys should have entries for indices 0, 2, 5
    expect(Object.keys(walletSecret.extendedPublicKeys).sort()).toEqual([
      '0',
      '2',
      '5'
    ])
    expect(walletSecret.extendedPublicKeys[0]).toEqual({
      evm: 'xpub_evm_0',
      avalanche: 'xpub_avalanche_0'
    })
    expect(walletSecret.extendedPublicKeys[2]).toEqual({
      evm: 'xpub_evm_2',
      avalanche: 'xpub_avalanche_2'
    })
    expect(walletSecret.extendedPublicKeys[5]).toEqual({
      evm: 'xpub_evm_5',
      avalanche: 'xpub_avalanche_5'
    })
  })

  it('throws if index 0 has no keys', async () => {
    const activeIndices = [0, 1]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)
    // Remove avalancheKeys for index 0
    delete multiIndexKeys.mainnet[0]!.avalancheKeys

    const { result } = renderHook(() => useLedgerWallet())

    await expect(
      act(async () => {
        await result.current.createLedgerWalletWithDiscovery({
          deviceId: 'device-1',
          deviceName: 'Nano X',
          derivationPathType: LedgerDerivationPathType.BIP44,
          multiIndexKeys,
          activeIndices
        })
      })
    ).rejects.toThrow(
      'Missing Avalanche keys for account index 0 during wallet creation'
    )
  })

  it('names accounts sequentially ("Account 1", "Account 2", etc.)', async () => {
    const { setAccount } = require('store/account')
    const activeIndices = [0, 1, 2]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)

    const { result } = renderHook(() => useLedgerWallet())

    await act(async () => {
      await result.current.createLedgerWalletWithDiscovery({
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        multiIndexKeys,
        activeIndices
      })
    })

    const accountNames = setAccount.mock.calls.map(
      (call: [{ name: string }]) => call[0].name
    )
    expect(accountNames).toEqual(['Account 1', 'Account 2', 'Account 3'])
  })

  it('shows snackbar message after successful wallet creation', async () => {
    const { showSnackbar } = require('new/common/utils/toast')
    const activeIndices = [0]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)

    const { result } = renderHook(() => useLedgerWallet())

    await act(async () => {
      await result.current.createLedgerWalletWithDiscovery({
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        multiIndexKeys,
        activeIndices
      })
    })

    expect(showSnackbar).toHaveBeenCalledTimes(1)
    expect(showSnackbar).toHaveBeenCalledWith(
      'Ledger wallet created successfully!'
    )
  })

  it('shows snackbar for multiple account creation', async () => {
    const { showSnackbar } = require('new/common/utils/toast')
    const activeIndices = [0, 1, 2]
    const multiIndexKeys = buildMultiIndexKeys(activeIndices)

    const { result } = renderHook(() => useLedgerWallet())

    await act(async () => {
      await result.current.createLedgerWalletWithDiscovery({
        deviceId: 'device-1',
        deviceName: 'Nano X',
        derivationPathType: LedgerDerivationPathType.BIP44,
        multiIndexKeys,
        activeIndices
      })
    })

    // The same snackbar message is shown regardless of the number of accounts
    expect(showSnackbar).toHaveBeenCalledTimes(1)
    expect(showSnackbar).toHaveBeenCalledWith(
      'Ledger wallet created successfully!'
    )
  })
})
