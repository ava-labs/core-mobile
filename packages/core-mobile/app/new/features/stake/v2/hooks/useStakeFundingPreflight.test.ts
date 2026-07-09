import { act, renderHook } from '@testing-library/react-hooks'
import { Operation, Step } from 'services/earn/computeDelegationSteps/types'
import { useStakeFundingPreflight } from './useStakeFundingPreflight'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockComputeSteps = jest.fn()
let mockIsComputeReady = true
jest.mock('contexts/DelegationContext', () => ({
  useDelegationContext: () => ({
    computeSteps: mockComputeSteps,
    isComputeReady: mockIsComputeReady
  })
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DELEGATE_STEPS: Step[] = [
  { operation: Operation.DELEGATE, amount: 1_000_000_000n, fee: 1n }
]

const INSUFFICIENT_ERROR = new Error(
  'Insufficient balance for the stake amount and fees.\nKindly adjust the amount accordingly.'
)

const defaultProps = {
  enabled: true,
  stakeAmountNanoAvax: 1_000_000_000n,
  additionalOutputs: undefined
}

const renderPreflight = (props: Partial<typeof defaultProps> = {}) =>
  renderHook((p: typeof defaultProps) => useStakeFundingPreflight(p), {
    initialProps: { ...defaultProps, ...props }
  })

// Flush the pending computeSteps promise scheduled by the effect.
const flush = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve()
  })
}

describe('useStakeFundingPreflight', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsComputeReady = true
    mockComputeSteps.mockResolvedValue(DELEGATE_STEPS)
  })

  it('reports a passed check when computeSteps resolves with steps', async () => {
    const { result } = renderPreflight()
    await flush()

    expect(mockComputeSteps).toHaveBeenCalledWith(1_000_000_000n, 0n)
    expect(result.current).toEqual({
      isCheckingFunding: false,
      hasInsufficientFunds: false
    })
  })

  it('flags insufficient funds when computeSteps rejects with an underfunded error', async () => {
    mockComputeSteps.mockRejectedValue(INSUFFICIENT_ERROR)

    const { result } = renderPreflight()
    await flush()

    expect(result.current).toEqual({
      isCheckingFunding: false,
      hasInsufficientFunds: true
    })
  })

  it('ignores transient (non-funding) errors so the submit path can handle them', async () => {
    mockComputeSteps.mockRejectedValue(new Error('network request failed'))

    const { result } = renderPreflight()
    await flush()

    expect(result.current).toEqual({
      isCheckingFunding: false,
      hasInsufficientFunds: false
    })
  })

  it('does not run and reports idle while disabled', async () => {
    const { result } = renderPreflight({ enabled: false })
    await flush()

    expect(mockComputeSteps).not.toHaveBeenCalled()
    expect(result.current.isCheckingFunding).toBe(false)
  })

  describe('when computeSteps inputs are still loading (restake race)', () => {
    it('holds the CTA as checking instead of passing the check', async () => {
      mockIsComputeReady = false

      const { result } = renderPreflight()
      await flush()

      // The regression this guards: before the fee-state / base-fee queries
      // resolve, computeSteps would return [] without validating anything —
      // reporting "not checking, funded" here enabled slide-to-confirm on an
      // unaffordable restake.
      expect(mockComputeSteps).not.toHaveBeenCalled()
      expect(result.current.isCheckingFunding).toBe(true)
    })

    it('runs the real check once the inputs become ready', async () => {
      mockIsComputeReady = false
      mockComputeSteps.mockRejectedValue(INSUFFICIENT_ERROR)

      const { result, rerender } = renderPreflight()
      await flush()
      expect(result.current.isCheckingFunding).toBe(true)

      mockIsComputeReady = true
      rerender(defaultProps)
      await flush()

      expect(mockComputeSteps).toHaveBeenCalledTimes(1)
      expect(result.current).toEqual({
        isCheckingFunding: false,
        hasInsufficientFunds: true
      })
    })

    it('keeps holding the CTA when computeSteps bails with no steps', async () => {
      // Inputs vanished between the readiness check and the call (e.g. account
      // switch): computeSteps resolves [] without validating anything.
      mockComputeSteps.mockResolvedValue([])

      const { result } = renderPreflight()
      await flush()

      expect(result.current.isCheckingFunding).toBe(true)
      expect(result.current.hasInsufficientFunds).toBe(false)
    })
  })
})
