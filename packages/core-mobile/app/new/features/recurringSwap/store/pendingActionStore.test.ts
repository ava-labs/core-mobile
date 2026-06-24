// In-memory MMKV stand-in so the persist middleware doesn't hit the native
// binding under Jest. We mock the barrel (`utils/mmkv`) and pass the rest of
// it through with `jest.requireActual` so unrelated exports like
// `ZustandStorageKeys` keep working.
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
jest.mock('utils/mmkv', () => ({
  ...jest.requireActual('utils/mmkv'),
  zustandStorageMMKV: mockMMKV
}))

import { TransferSignatureReason } from '@avalabs/fusion-sdk'
import { PENDING_ACTION_TTL_MS, pendingActionStore } from './pendingActionStore'

const reset = (): void => pendingActionStore.setState({ pending: {} })

describe('pendingActionStore', () => {
  beforeEach(() => {
    reset()
    Object.keys(mmkvStore).forEach(k => delete mmkvStore[k])
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('markPending records the orderId + action type with the current timestamp', () => {
    const now = 1_700_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(now)

    pendingActionStore
      .getState()
      .markPending('0xabc', TransferSignatureReason.CancelRecurringSwap, {
        ownerAddress: '0xowner',
        chainId: 43114
      })

    expect(pendingActionStore.getState().pending).toEqual({
      '0xabc': {
        type: TransferSignatureReason.CancelRecurringSwap,
        addedAt: now,
        ownerAddress: '0xowner',
        chainId: 43114
      }
    })
  })

  it('markPending overwrites the entry when the same orderId is re-marked with a different action', () => {
    const now = 1_700_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(now)

    pendingActionStore
      .getState()
      .markPending('0xabc', TransferSignatureReason.PauseRecurringSwap, {
        ownerAddress: '0xowner',
        chainId: 43114
      })
    pendingActionStore
      .getState()
      .markPending('0xabc', TransferSignatureReason.ResumeRecurringSwap, {
        ownerAddress: '0xowner',
        chainId: 43114
      })

    expect(pendingActionStore.getState().pending['0xabc']).toEqual({
      type: TransferSignatureReason.ResumeRecurringSwap,
      addedAt: now,
      ownerAddress: '0xowner',
      chainId: 43114
    })
  })

  it('clearPending removes the entry; no-op for unknown orderIds', () => {
    pendingActionStore
      .getState()
      .markPending('0xabc', TransferSignatureReason.CancelRecurringSwap, {
        ownerAddress: '0xowner',
        chainId: 43114
      })
    pendingActionStore.getState().clearPending('0xabc')
    expect(pendingActionStore.getState().pending).toEqual({})

    // No-op path — should not throw or mutate state.
    const before = pendingActionStore.getState().pending
    pendingActionStore.getState().clearPending('0xnotthere')
    expect(pendingActionStore.getState().pending).toBe(before)
  })

  it('isExpired is false for absent entries and within-TTL entries', () => {
    const now = 1_700_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(now)
    pendingActionStore
      .getState()
      .markPending('0xabc', TransferSignatureReason.CancelRecurringSwap, {
        ownerAddress: '0xowner',
        chainId: 43114
      })

    expect(pendingActionStore.getState().isExpired('0xabc', now)).toBe(false)
    expect(
      pendingActionStore
        .getState()
        .isExpired('0xabc', now + PENDING_ACTION_TTL_MS - 1)
    ).toBe(false)
    expect(pendingActionStore.getState().isExpired('0xmissing', now)).toBe(
      false
    )
  })

  it('isExpired is true once the TTL has elapsed', () => {
    const now = 1_700_000_000_000
    jest.spyOn(Date, 'now').mockReturnValue(now)
    pendingActionStore
      .getState()
      .markPending('0xabc', TransferSignatureReason.PauseRecurringSwap, {
        ownerAddress: '0xowner',
        chainId: 43114
      })

    expect(
      pendingActionStore
        .getState()
        .isExpired('0xabc', now + PENDING_ACTION_TTL_MS)
    ).toBe(true)
  })
})
