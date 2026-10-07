import {
  FAST_STAKE_MIN_REWARD_HEADROOM_SECONDS,
  FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS,
  FAST_STAKE_TOP_CANDIDATES,
  MIN_VALIDATOR_REACHABILITY_PERCENT
} from '../constants'
import {
  getRewardHeadroomSeconds,
  isFastStakeEligible,
  isValidatorReachable,
  selectFastStakeValidator
} from './selectFastStakeValidator'

const NOW = 1_800_000_000
const SECONDS_PER_DAY = 24 * 60 * 60

const candidate = ({
  nodeId = 'NodeID-A',
  ageDays = 100,
  remainingDays = 200,
  uptimePerformance = 100,
  reachabilityPercent = 100
}: {
  nodeId?: string
  ageDays?: number
  remainingDays?: number
  uptimePerformance?: number
  reachabilityPercent?: number
} = {}): {
  nodeId: string
  startTimestamp: number
  endTimestamp: number
  uptimePerformance: number
  validatorHealth: {
    reachabilityPercent: number
    benchedPChainRequestsPercent: number
    benchedXChainRequestsPercent: number
    benchedCChainRequestsPercent: number
  }
} => ({
  nodeId,
  startTimestamp: NOW - ageDays * SECONDS_PER_DAY,
  endTimestamp: NOW + remainingDays * SECONDS_PER_DAY,
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
  it('returns the downtime a validator can still absorb while staying above the 80% reward requirement', () => {
    // 100 days at 90% = 90 days up; +200 remaining = 290; needs 0.8 * 300 = 240 → 50 days of headroom
    expect(
      getRewardHeadroomSeconds(candidate({ uptimePerformance: 90 }), NOW)
    ).toBeCloseTo(50 * SECONDS_PER_DAY)
  })

  it('is negative when the validator can no longer reach the requirement', () => {
    expect(
      getRewardHeadroomSeconds(
        candidate({ ageDays: 300, remainingDays: 10, uptimePerformance: 50 }),
        NOW
      )
    ).toBeLessThan(0)
  })
})

describe('isFastStakeEligible', () => {
  it('accepts an established, reachable validator with enough headroom', () => {
    expect(isFastStakeEligible(candidate(), NOW)).toBe(true)
  })

  it('rejects an unreachable validator', () => {
    expect(
      isFastStakeEligible(candidate({ reachabilityPercent: 0 }), NOW)
    ).toBe(false)
  })

  it('rejects a validator younger than the minimum age', () => {
    const ageDays = FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS / SECONDS_PER_DAY - 1
    expect(isFastStakeEligible(candidate({ ageDays }), NOW)).toBe(false)
  })

  it('accepts a validator exactly at the minimum age', () => {
    const ageDays = FAST_STAKE_MIN_VALIDATOR_AGE_SECONDS / SECONDS_PER_DAY
    expect(isFastStakeEligible(candidate({ ageDays }), NOW)).toBe(true)
  })

  it('rejects a validator below the minimum reward headroom', () => {
    // 300 days at 81% = 243 up; +10 remaining = 253; needs 0.8 * 310 = 248 → 5 days of headroom
    const lowHeadroom = candidate({
      ageDays: 300,
      remainingDays: 10,
      uptimePerformance: 81
    })
    expect(getRewardHeadroomSeconds(lowHeadroom, NOW)).toBeLessThan(
      FAST_STAKE_MIN_REWARD_HEADROOM_SECONDS
    )
    expect(isFastStakeEligible(lowHeadroom, NOW)).toBe(false)
  })
})

describe('selectFastStakeValidator', () => {
  const select = (
    candidates: ReturnType<typeof candidate>[],
    r: number
  ): string | undefined =>
    selectFastStakeValidator(candidates, { now: NOW, random: () => r })?.nodeId

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

  it('only picks from the top candidates ranked by reward headroom', () => {
    const top = Array.from({ length: FAST_STAKE_TOP_CANDIDATES }, (_, i) =>
      candidate({ nodeId: `NodeID-TOP-${i}` })
    )
    const outsider = candidate({
      nodeId: 'NodeID-OUTSIDER',
      uptimePerformance: 99
    })
    const candidates = [outsider, ...top]

    expect([0, 0.5, 0.99].map(r => select(candidates, r))).not.toContain(
      'NodeID-OUTSIDER'
    )
  })
})
