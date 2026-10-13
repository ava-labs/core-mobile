import {
  FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS,
  FAST_STAKE_TOP_CANDIDATES,
  MIN_VALIDATOR_REACHABILITY_PERCENT
} from '../constants'
import {
  FastStakeSelectionContext,
  getRewardHeadroomSeconds,
  isFastStakeEligible,
  isValidatorReachable,
  selectFastStakeValidator
} from './selectFastStakeValidator'

const DAY = 24 * 60 * 60
const NOW = 1_800_000_000

const context = ({
  delegationDays = 30
}: { delegationDays?: number } = {}): FastStakeSelectionContext => ({
  now: NOW,
  delegationEndTime: NOW + delegationDays * DAY
})

const candidate = ({
  nodeId = 'NodeID-A',
  ageDays = 400,
  uptimePerformance = 100,
  reachabilityPercent = 100
}: {
  nodeId?: string
  ageDays?: number
  uptimePerformance?: number
  reachabilityPercent?: number
} = {}): {
  nodeId: string
  startTimestamp: number
  uptimePerformance: number
  validatorHealth: {
    reachabilityPercent: number
    benchedPChainRequestsPercent: number
    benchedXChainRequestsPercent: number
    benchedCChainRequestsPercent: number
  }
} => ({
  nodeId,
  startTimestamp: NOW - ageDays * DAY,
  uptimePerformance,
  validatorHealth: {
    reachabilityPercent,
    benchedPChainRequestsPercent: 0,
    benchedXChainRequestsPercent: 0,
    benchedCChainRequestsPercent: 0
  }
})

describe('isValidatorReachable', () => {
  it('returns true for a fully reachable validator', () => {
    expect(isValidatorReachable(candidate())).toBe(true)
  })

  it('returns false for an unreachable validator', () => {
    expect(isValidatorReachable(candidate({ reachabilityPercent: 0 }))).toBe(
      false
    )
  })

  it('returns false at the threshold', () => {
    expect(
      isValidatorReachable(
        candidate({ reachabilityPercent: MIN_VALIDATOR_REACHABILITY_PERCENT })
      )
    ).toBe(false)
  })

  it('returns true just above the threshold', () => {
    expect(
      isValidatorReachable(
        candidate({
          reachabilityPercent: MIN_VALIDATOR_REACHABILITY_PERCENT + 1
        })
      )
    ).toBe(true)
  })
})

describe('getRewardHeadroomSeconds', () => {
  it('measures headroom at the delegation end, not the validator end', () => {
    // 100 days at 95% = 95 up; +30 delegation = 125; needs 0.9 * 130 = 117 → 8 days
    expect(
      getRewardHeadroomSeconds(
        candidate({ ageDays: 100, uptimePerformance: 95 }),
        context()
      )
    ).toBeCloseTo(8 * DAY)
  })

  it('is negative when the validator can no longer reach the requirement', () => {
    expect(
      getRewardHeadroomSeconds(
        candidate({ ageDays: 300, uptimePerformance: 50 }),
        context()
      )
    ).toBeLessThan(0)
  })
})

describe('isFastStakeEligible', () => {
  it('accepts an established, reachable validator', () => {
    expect(isFastStakeEligible(candidate(), context())).toBe(true)
  })

  it('rejects an unreachable validator', () => {
    expect(
      isFastStakeEligible(candidate({ reachabilityPercent: 0 }), context())
    ).toBe(false)
  })

  it('rejects a validator younger than the minimum age', () => {
    const ageDays = FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS / DAY - 1
    expect(isFastStakeEligible(candidate({ ageDays }), context())).toBe(false)
  })

  it('accepts a validator exactly at the minimum age', () => {
    const ageDays = FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS / DAY
    expect(isFastStakeEligible(candidate({ ageDays }), context())).toBe(true)
  })

  it('accepts a minimum-age validator on a short delegation', () => {
    // 14 days at 98% over a 14-day delegation leaves only ~2.5 days of headroom
    expect(
      isFastStakeEligible(
        candidate({ ageDays: 14, uptimePerformance: 98 }),
        context({ delegationDays: 14 })
      )
    ).toBe(true)
  })
})

describe('selectFastStakeValidator', () => {
  const select = (
    candidates: ReturnType<typeof candidate>[],
    r: number
  ): string | undefined =>
    selectFastStakeValidator(candidates, { ...context(), random: () => r })
      ?.nodeId

  it('returns undefined when no candidate is eligible', () => {
    expect(
      select(
        [candidate({ reachabilityPercent: 0 }), candidate({ ageDays: 1 })],
        0
      )
    ).toBeUndefined()
  })

  it('skips ineligible candidates', () => {
    expect(
      select(
        [
          candidate({ nodeId: 'NodeID-NEW', ageDays: 1 }),
          candidate({ nodeId: 'NodeID-OLD' })
        ],
        0
      )
    ).toBe('NodeID-OLD')
  })

  it('picks uniformly among eligible candidates', () => {
    const candidates = [
      candidate({ nodeId: 'NodeID-A' }),
      candidate({ nodeId: 'NodeID-B' })
    ]

    expect(select(candidates, 0)).toBe('NodeID-A')
    expect(select(candidates, 0.49)).toBe('NodeID-A')
    expect(select(candidates, 0.5)).toBe('NodeID-B')
    expect(select(candidates, 0.99)).toBe('NodeID-B')
  })

  it('ranks by reward headroom rather than uptime', () => {
    // 400 days at 99% → 39 days of headroom; 60 days at 100% → 9 days
    const top = Array.from({ length: FAST_STAKE_TOP_CANDIDATES }, (_, i) =>
      candidate({ nodeId: `NodeID-TOP-${i}`, uptimePerformance: 99 })
    )
    const highUptimeLowHeadroom = candidate({
      nodeId: 'NodeID-OUTSIDER',
      ageDays: 60
    })
    const candidates = [highUptimeLowHeadroom, ...top]

    expect([0, 0.5, 0.99].map(r => select(candidates, r))).not.toContain(
      'NodeID-OUTSIDER'
    )
  })
})
