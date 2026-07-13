import { PChainTransaction } from '@avalabs/glacier-sdk'
import { renderHook } from '@testing-library/react-hooks'
import { addDays, addHours, getUnixTime } from 'date-fns'
import { useStakeAmount } from 'hooks/earn/useStakeAmount'
import {
  clearRestakePrefill,
  createDefaultDelegateFilters,
  getRestakePrefill,
  setDelegateNodeSelection,
  takeRestakeEntry,
  useDelegateFilters,
  useDelegateNodeSelection
} from '../store'
import { useRestake } from './useRestake'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate })
}))

// The hook only reads `selectIsDeveloperMode`; return the flag directly.
let mockIsDeveloperMode = false
jest.mock('react-redux', () => ({
  useSelector: () => mockIsDeveloperMode
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: jest.fn()
}))

// Branch classification is covered by the utils' own tests — mock them here
// so each navigation branch can be exercised deterministically.
const mockIsFastStakeTx = jest.fn()
jest.mock('../utils/isFastStakeTx', () => ({
  isFastStakeTx: (...args: unknown[]) => mockIsFastStakeTx(...args)
}))
const mockIsDelegationTx = jest.fn()
jest.mock('../utils/isDelegationTx', () => ({
  isDelegationTx: (...args: unknown[]) => mockIsDelegationTx(...args)
}))

// `useStakeAmount` transitively imports the MMKV-backed zustand storage;
// stub the barrel so the test never touches native storage.
jest.mock('utils/mmkv', () => ({
  zustandPersistStorage: {}
}))

// The real module drags in EarnService → WalletService → ModuleManager (native
// deps); the hook only reads two static staking-config fields. Mainnet values.
jest.mock('services/earn/utils', () => ({
  getStakingConfig: () => ({
    MinDelegationFee: 20000n, // permillion → 2%
    MinStakeDuration: 14 * 24 * 60 * 60 // seconds → 14 days
  })
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DAY_SECONDS = 24 * 60 * 60
const FIXED_NOW = new Date('2026-01-15T00:00:00Z')

const makeTx = (
  overrides: Partial<PChainTransaction> = {}
): PChainTransaction =>
  ({
    nodeId: 'NodeID-A',
    startTimestamp: 1_000_000,
    endTimestamp: 1_000_000 + 14 * DAY_SECONDS,
    amountStaked: [{ amount: '25000000000' }],
    txHash: '0xabc',
    ...overrides
  } as unknown as PChainTransaction)

// Web-parity end time: now + whole-day duration + 1h slack (see useRestake).
const expectedStakeEndTime = getUnixTime(addHours(addDays(FIXED_NOW, 14), 1))

const getOnRestake = (): ReturnType<typeof useRestake>['getOnRestake'] =>
  renderHook(() => useRestake()).result.current.getOnRestake

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useRestake', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW)
    mockNavigate.mockReset()
    mockIsFastStakeTx.mockReset().mockReturnValue(false)
    mockIsDelegationTx.mockReset().mockReturnValue(false)
    mockIsDeveloperMode = false
    // Reset the shared stores the handler seeds.
    useStakeAmount.setState(prev => prev.sub(prev)) // zero, keeps unit shape
    clearRestakePrefill()
    takeRestakeEntry() // drain the one-shot flag
    setDelegateNodeSelection([], 0)
    useDelegateFilters.getState().reset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns undefined for stakes that are not completed', () => {
    mockIsFastStakeTx.mockReturnValue(true)
    expect(getOnRestake()(makeTx(), false)).toBeUndefined()
  })

  it('returns undefined when the tx cannot seed restake params', () => {
    mockIsFastStakeTx.mockReturnValue(true)
    expect(getOnRestake()(makeTx({ nodeId: undefined }), true)).toBeUndefined()
  })

  it('returns undefined when the tx is neither fast stake nor delegation', () => {
    expect(getOnRestake()(makeTx(), true)).toBeUndefined()
  })

  it('fast stake: seeds amount/prefill/entry flag and navigates to the fast confirm', () => {
    mockIsFastStakeTx.mockReturnValue(true)

    const handler = getOnRestake()(makeTx(), true)
    expect(handler).toBeDefined()
    handler?.()

    // Original amount seeded into the shared store (25 AVAX in nAVAX).
    expect(useStakeAmount.getState().toSubUnit()).toBe(25_000_000_000n)
    // Restake prefill + one-shot layout flag are pending.
    expect(getRestakePrefill()).toEqual({ durationDays: 14 })
    expect(takeRestakeEntry()).toBe(true)

    expect(mockNavigate).toHaveBeenCalledWith(
      `/addStakeV2/fastStake/confirm?stakeEndTime=${expectedStakeEndTime}&preferredNodeId=NodeID-A`
    )
  })

  it('delegation: seeds stores, resets the node selection and navigates to the delegate confirm', () => {
    mockIsDelegationTx.mockReturnValue(true)
    // Simulate a stale selection from a previous delegate flow.
    setDelegateNodeSelection([{ nodeID: 'NodeID-STALE' }] as never[], 0)

    const handler = getOnRestake()(makeTx(), true)
    expect(handler).toBeDefined()
    handler?.()

    expect(useStakeAmount.getState().toSubUnit()).toBe(25_000_000_000n)
    expect(getRestakePrefill()).toEqual({ durationDays: 14 })
    expect(takeRestakeEntry()).toBe(true)
    // Stale node selection cleared so the confirm can't read it.
    expect(useDelegateNodeSelection.getState().nodes).toHaveLength(0)

    // Web-parity default filters seeded from the (mocked) staking config:
    // fee ≤ 2%, remaining time ≥ 14 days.
    expect(useDelegateFilters.getState().filters).toEqual(
      createDefaultDelegateFilters({ minFeePercent: 2, minStakeDays: 14 })
    )

    expect(mockNavigate).toHaveBeenCalledWith(
      `/addStakeV2/delegate/confirm?stakeEndTime=${expectedStakeEndTime}&restakeNodeId=NodeID-A`
    )
  })

  it('sums multiple staked assets into the seeded amount', () => {
    mockIsFastStakeTx.mockReturnValue(true)
    const handler = getOnRestake()(
      makeTx({
        amountStaked: [
          { amount: '25000000000' },
          { amount: '5000000000' }
        ] as PChainTransaction['amountStaked']
      }),
      true
    )
    handler?.()
    expect(useStakeAmount.getState().toSubUnit()).toBe(30_000_000_000n)
  })
})
