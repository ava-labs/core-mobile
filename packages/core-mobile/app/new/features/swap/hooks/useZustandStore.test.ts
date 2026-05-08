import { stringifyTransfer } from '@avalabs/fusion-sdk'
import type { Transfer, FusionTransfer } from '../types'

// ─── Mocks ────────────────────────────────────────────────────────────────────

// In-memory MMKV stand-in: maps key → raw string
const mmkvStore: Record<string, string> = {}

const mockMMKV = {
  getString: jest.fn((key: string) => mmkvStore[key] ?? undefined),
  set: jest.fn((key: string, value: string) => {
    mmkvStore[key] = value
  }),
  remove: jest.fn((key: string) => {
    delete mmkvStore[key]
  })
}

// Mock the barrel (`utils/mmkv`) — the path the consumer imports from —
// rather than the submodule (`utils/mmkv/storages`). Mocking the barrel
// directly keeps the test correct if the barrel's re-export style ever
// changes. `jest.requireActual` preserves the other exports
// (ZustandStorageKeys, helpers, etc.) so unrelated imports still work.
jest.mock('utils/mmkv', () => ({
  ...jest.requireActual('utils/mmkv'),
  zustandStorageMMKV: mockMMKV
}))

jest.mock('utils/Logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}))

jest.mock('common/utils/createZustandStore', () => ({
  createZustandStore: (initial: unknown) => {
    let state = initial
    const store = () => state
    store.getState = () => state
    store.setState = (v: unknown) => {
      state = v
    }
    return store
  }
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Chain shape matches the SDK's zod schema (networkToken + rpcUrl required)
const makeChain = (chainId: string, chainName: string) => ({
  chainId,
  chainName,
  rpcUrl: 'https://rpc.example.com',
  networkToken: {
    type: 'native',
    name: chainName,
    symbol: 'AVAX',
    decimals: 18
  }
})

const makeTransfer = (
  id: string,
  status: Transfer['status'] = 'source-pending'
): Transfer =>
  ({
    id,
    status,
    amountIn: 1000000000000000000n,
    amountOut: 2000000000000000000n,
    fees: [
      {
        type: 'gas',
        name: 'Gas Fee',
        amount: 100n,
        chainId: 'eip155:43114',
        token: { type: 'native' }
      }
    ],
    environment: 'production',
    fromAddress: '0xabc',
    toAddress: '0xdef',
    partnerFeeBps: null,
    type: 'markr',
    sourceAsset: {
      type: 'native',
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18
    },
    targetAsset: {
      type: 'erc20',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x0'
    },
    sourceChain: makeChain('eip155:43114', 'Avalanche'),
    targetChain: makeChain('eip155:1', 'Ethereum')
  } as unknown as Transfer)

const makeFusionTransfer = (
  id: string,
  status: Transfer['status'] = 'source-pending'
): FusionTransfer => ({
  transfer: makeTransfer(id, status),
  fromToken: { localId: 'avax-local' },
  toToken: { localId: 'usdc-local' },
  timestamp: 1000
})

const STORAGE_KEY = 'fusionTransfers'

// ─── Import store after mocks are set up ─────────────────────────────────────

const {
  fusionTransfersStore,
  updateFusionTransfer,
  getPendingFusionTransfers
} = require('./useZustandStore')

// Access the persist storage adapter directly so we can unit-test getItem /
// setItem without going through Zustand's async rehydration machinery.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const persistStorage: any = fusionTransfersStore.persist.getOptions().storage

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset store state first (which writes an empty snapshot to mmkvStore)
  fusionTransfersStore.getState().clearAllTransfers()
  // Then wipe mmkvStore so individual tests start with an empty MMKV
  Object.keys(mmkvStore).forEach(k => delete mmkvStore[k])
  // Clear mock call counts after all setup side-effects
  jest.clearAllMocks()
})

// ─── fusionTransfersPersistStorage — setItem ──────────────────────────────────

describe('fusionTransfersPersistStorage — setItem', () => {
  it('stores each transfer as a string, not an object', () => {
    const ft = makeFusionTransfer('transfer-1')
    persistStorage.setItem(STORAGE_KEY, {
      state: { transfers: { 'transfer-1': ft } },
      version: 1
    })

    const stored = JSON.parse(mmkvStore[STORAGE_KEY] as string)
    expect(typeof stored.state.transfers['transfer-1'].transfer).toBe('string')
  })

  it('serialized string contains bigint markers (not silent loss)', () => {
    const ft = makeFusionTransfer('transfer-1')
    persistStorage.setItem(STORAGE_KEY, {
      state: { transfers: { 'transfer-1': ft } },
      version: 1
    })

    const stored = JSON.parse(mmkvStore[STORAGE_KEY] as string)
    const serialized: string = stored.state.transfers['transfer-1'].transfer
    expect(serialized).toContain('__type')
    expect(serialized).toContain('bigint')
  })

  it('preserves non-transfer metadata (fromToken, toToken, timestamp) unchanged', () => {
    const ft = makeFusionTransfer('transfer-1')
    persistStorage.setItem(STORAGE_KEY, {
      state: { transfers: { 'transfer-1': ft } },
      version: 1
    })

    const stored = JSON.parse(mmkvStore[STORAGE_KEY] as string).state.transfers[
      'transfer-1'
    ]
    expect(stored.fromToken).toEqual(ft.fromToken)
    expect(stored.toToken).toEqual(ft.toToken)
    expect(stored.timestamp).toBe(ft.timestamp)
  })

  it('stores multiple transfers independently', () => {
    persistStorage.setItem(STORAGE_KEY, {
      state: {
        transfers: {
          'transfer-1': makeFusionTransfer('transfer-1'),
          'transfer-2': makeFusionTransfer('transfer-2', 'completed')
        }
      },
      version: 1
    })

    const stored = JSON.parse(mmkvStore[STORAGE_KEY] as string).state.transfers
    expect(Object.keys(stored)).toContain('transfer-1')
    expect(Object.keys(stored)).toContain('transfer-2')
    expect(typeof stored['transfer-1'].transfer).toBe('string')
    expect(typeof stored['transfer-2'].transfer).toBe('string')
  })
})

// ─── fusionTransfersPersistStorage — getItem ──────────────────────────────────

describe('fusionTransfersPersistStorage — getItem', () => {
  it('returns null when MMKV has no entry for the key', () => {
    expect(persistStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('deserializes bigint fields back to BigInt values', () => {
    const ft = makeFusionTransfer('transfer-1')
    mmkvStore[STORAGE_KEY] = JSON.stringify({
      state: {
        transfers: {
          'transfer-1': { ...ft, transfer: stringifyTransfer(ft.transfer) }
        }
      },
      version: 1
    })

    const result = persistStorage.getItem(STORAGE_KEY)

    const loaded = result.state.transfers['transfer-1']
    expect(loaded).toBeDefined()
    expect(typeof loaded.transfer.amountIn).toBe('bigint')
    expect(loaded.transfer.amountIn).toBe(ft.transfer.amountIn)
    expect(loaded.transfer.amountOut).toBe(ft.transfer.amountOut)
  })

  it('returns null on corrupt top-level JSON', () => {
    mmkvStore[STORAGE_KEY] = 'not valid json {'
    expect(persistStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('skips entries that fail parseTransfer and logs a warning', () => {
    const ft = makeFusionTransfer('transfer-good')
    mmkvStore[STORAGE_KEY] = JSON.stringify({
      state: {
        transfers: {
          'transfer-good': { ...ft, transfer: stringifyTransfer(ft.transfer) },
          // Invalid serialized string — parseTransfer will throw on this
          'transfer-bad': { ...ft, transfer: 'not-a-valid-transfer-string' }
        }
      },
      version: 1
    })

    const result = persistStorage.getItem(STORAGE_KEY)

    expect(Object.keys(result.state.transfers)).toEqual(['transfer-good'])
    const warnMock = require('utils/Logger').warn as jest.Mock
    expect(warnMock).toHaveBeenCalledWith(
      expect.stringContaining('transfer-bad'),
      expect.anything()
    )
  })

  it('round-trips a transfer through setItem then getItem with bigints intact', () => {
    const ft = makeFusionTransfer('transfer-1')
    persistStorage.setItem(STORAGE_KEY, {
      state: { transfers: { 'transfer-1': ft } },
      version: 1
    })

    const result = persistStorage.getItem(STORAGE_KEY)

    const loaded = result.state.transfers['transfer-1']
    expect(loaded.transfer.amountIn).toBe(ft.transfer.amountIn)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(loaded.transfer.fees[0].amount).toBe(ft.transfer.fees[0]!.amount)
    expect(typeof loaded.transfer.amountIn).toBe('bigint')
    expect(typeof loaded.transfer.fees[0].amount).toBe('bigint')
  })
})

// ─── fusionTransfersPersistStorage — removeItem ───────────────────────────────

describe('fusionTransfersPersistStorage — removeItem', () => {
  it('delegates to MMKV.remove', () => {
    persistStorage.removeItem(STORAGE_KEY)
    expect(mockMMKV.remove).toHaveBeenCalledWith(STORAGE_KEY)
  })
})

// ─── Store actions ────────────────────────────────────────────────────────────

describe('fusionTransfersStore — actions', () => {
  it('setTransfers accepts a plain map', () => {
    const ft = makeFusionTransfer('transfer-1')
    fusionTransfersStore.getState().setTransfers({ 'transfer-1': ft })
    expect(fusionTransfersStore.getState().transfers['transfer-1']).toEqual(ft)
  })

  it('setTransfers accepts an updater function', () => {
    const ft1 = makeFusionTransfer('transfer-1')
    const ft2 = makeFusionTransfer('transfer-2')
    fusionTransfersStore.getState().setTransfers({ 'transfer-1': ft1 })
    fusionTransfersStore
      .getState()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .setTransfers((prev: any) => ({ ...prev, 'transfer-2': ft2 }))
    expect(Object.keys(fusionTransfersStore.getState().transfers)).toHaveLength(
      2
    )
  })

  it('removeTransfer removes only the specified entry', () => {
    fusionTransfersStore.getState().setTransfers({
      'transfer-1': makeFusionTransfer('transfer-1'),
      'transfer-2': makeFusionTransfer('transfer-2')
    })
    fusionTransfersStore.getState().removeTransfer('transfer-1')
    expect(
      fusionTransfersStore.getState().transfers['transfer-1']
    ).toBeUndefined()
    expect(
      fusionTransfersStore.getState().transfers['transfer-2']
    ).toBeDefined()
  })

  it('clearCompletedTransfers keeps only in-progress transfers', () => {
    fusionTransfersStore.getState().setTransfers({
      pending: makeFusionTransfer('pending', 'source-pending'),
      done: makeFusionTransfer('done', 'completed'),
      failed: makeFusionTransfer('failed', 'failed'),
      refunded: makeFusionTransfer('refunded', 'refunded')
    })
    fusionTransfersStore.getState().clearCompletedTransfers()
    expect(Object.keys(fusionTransfersStore.getState().transfers)).toEqual([
      'pending'
    ])
  })

  it('clearAllTransfers empties the map', () => {
    fusionTransfersStore.getState().setTransfers({
      'transfer-1': makeFusionTransfer('transfer-1'),
      'transfer-2': makeFusionTransfer('transfer-2')
    })
    fusionTransfersStore.getState().clearAllTransfers()
    expect(fusionTransfersStore.getState().transfers).toEqual({})
  })
})

// ─── updateFusionTransfer ─────────────────────────────────────────────────────

describe('updateFusionTransfer', () => {
  it('updates only the transfer field, leaving metadata intact', () => {
    const ft = makeFusionTransfer('transfer-1')
    fusionTransfersStore.getState().setTransfers({ 'transfer-1': ft })

    const updated = {
      ...makeTransfer('transfer-1'),
      status: 'completed'
    } as Transfer
    updateFusionTransfer(updated)

    const result = fusionTransfersStore.getState().transfers['transfer-1']
    expect(result.transfer.status).toBe('completed')
    expect(result.fromToken).toEqual(ft.fromToken)
    expect(result.toToken).toEqual(ft.toToken)
    expect(result.timestamp).toBe(ft.timestamp)
  })

  it('is a no-op when the transfer id does not exist', () => {
    fusionTransfersStore
      .getState()
      .setTransfers({ 'transfer-1': makeFusionTransfer('transfer-1') })

    updateFusionTransfer(makeTransfer('unknown-id'))

    expect(Object.keys(fusionTransfersStore.getState().transfers)).toHaveLength(
      1
    )
  })
})

// ─── getPendingFusionTransfers ────────────────────────────────────────────────

describe('getPendingFusionTransfers', () => {
  it('returns only in-progress transfers', () => {
    fusionTransfersStore.getState().setTransfers({
      pending: makeFusionTransfer('pending', 'source-pending'),
      completed: makeFusionTransfer('completed', 'completed'),
      failed: makeFusionTransfer('failed', 'failed')
    })
    const result = getPendingFusionTransfers()
    expect(result).toHaveLength(1)
    expect(result[0].transfer.id).toBe('pending')
  })

  it('returns empty array when all transfers are terminal', () => {
    fusionTransfersStore.getState().setTransfers({
      completed: makeFusionTransfer('completed', 'completed'),
      failed: makeFusionTransfer('failed', 'failed'),
      refunded: makeFusionTransfer('refunded', 'refunded')
    })
    expect(getPendingFusionTransfers()).toHaveLength(0)
  })
})
