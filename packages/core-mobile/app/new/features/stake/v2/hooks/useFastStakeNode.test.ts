import {
  ActiveValidatorDetails,
  Network,
  SortByOption,
  StakingType
} from '@avalabs/glacier-sdk'
import GlacierService from 'services/glacier/GlacierService'
import {
  buildFastStakeFilters,
  fetchFastStakeValidator,
  pickActiveValidators,
  toFastStakeValidator
} from './useFastStakeNode'

describe('buildFastStakeFilters', () => {
  it('encodes the PRD FR-QS-5 selection criteria as Glacier query filters', () => {
    expect(
      buildFastStakeFilters({
        isTestnet: false,
        stakeAmountNAvax: '25000000000',
        minTimeRemainingSeconds: 30 * 24 * 60 * 60
      })
    ).toEqual({
      network: Network.MAINNET,
      validationStatus: 'active',
      minUptimePerformance: 98,
      maxFeePercentage: 2,
      minDelegationCapacity: '25000000000',
      minTimeRemaining: 30 * 24 * 60 * 60
    })
  })

  it('targets the Fuji network when isTestnet is true', () => {
    expect(
      buildFastStakeFilters({
        isTestnet: true,
        stakeAmountNAvax: '1000000000',
        minTimeRemainingSeconds: 14 * 24 * 60 * 60
      }).network
    ).toBe(Network.TESTNET)
  })

  it('floors a negative time-remaining to 0 (Glacier rejects negative values)', () => {
    expect(
      buildFastStakeFilters({
        isTestnet: false,
        stakeAmountNAvax: '0',
        minTimeRemainingSeconds: -42
      }).minTimeRemaining
    ).toBe(0)
  })
})

describe('pickActiveValidators', () => {
  it('keeps only validators whose validationStatus is "active"', () => {
    const result = pickActiveValidators([
      { validationStatus: 'active', nodeId: 'A' },
      { validationStatus: 'completed', nodeId: 'B' },
      { validationStatus: 'pending', nodeId: 'C' },
      { validationStatus: 'removed', nodeId: 'D' },
      { validationStatus: 'active', nodeId: 'E' }
    ])

    expect(result.map(v => v.nodeId)).toEqual(['A', 'E'])
  })

  it('returns an empty array when nothing matches', () => {
    expect(pickActiveValidators([{ validationStatus: 'completed' }])).toEqual(
      []
    )
  })
})

describe('toFastStakeValidator', () => {
  it('maps Glacier `ActiveValidatorDetails` to the flow-neutral `StakeTargetValidator` shape', () => {
    const glacier: ActiveValidatorDetails = {
      txHash: 'tx-A',
      nodeId: 'NodeID-A',
      subnetId: 'subnet',
      amountStaked: '1000000000000',
      startTimestamp: 1_000_000,
      endTimestamp: 2_000_000,
      stakePercentage: 0.1,
      delegatorCount: 0,
      uptimePerformance: 99,
      delegationFee: '2',
      // The rest of the fields aren't read by the consumer but must satisfy
      // the SDK's discriminated union; values are placeholders.
      potentialRewards: {} as ActiveValidatorDetails['potentialRewards'],
      validationStatus: ActiveValidatorDetails.validationStatus.ACTIVE,
      validatorHealth: {} as ActiveValidatorDetails['validatorHealth'],
      geolocation: null,
      stakingType: StakingType.FIXED
    }

    // `nodeID`, `endTime` and `delegationFee` are surfaced (the fee feeds
    // the reward estimate); uptime is intentionally dropped to keep the
    // shape flow-neutral.
    expect(toFastStakeValidator(glacier)).toEqual({
      nodeID: 'NodeID-A',
      endTime: '2000000',
      delegationFee: '2'
    })
  })
})

const NOW = 1_800_000_000
const DAY = 24 * 60 * 60

const glacierValidator = (
  nodeId: string,
  {
    reachabilityPercent = 100,
    ageDays = 100
  }: { reachabilityPercent?: number; ageDays?: number } = {}
): ActiveValidatorDetails =>
  ({
    validationStatus: 'active',
    nodeId,
    startTimestamp: NOW - ageDays * DAY,
    endTimestamp: NOW + 200 * DAY,
    uptimePerformance: 100,
    validatorHealth: { reachabilityPercent }
  } as unknown as ActiveValidatorDetails)

describe('fetchFastStakeValidator', () => {
  const baseParams = {
    isTestnet: false,
    stakeAmountNAvax: '25000000000',
    endTimeSeconds: NOW + 30 * DAY,
    now: NOW,
    random: () => 0
  }

  let mockListValidators: jest.SpyInstance<
    ReturnType<typeof GlacierService.listPrimaryNetworkValidators>,
    Parameters<typeof GlacierService.listPrimaryNetworkValidators>
  >

  beforeEach(() => {
    mockListValidators = jest.spyOn(
      GlacierService,
      'listPrimaryNetworkValidators'
    )
  })

  afterEach(() => {
    mockListValidators.mockRestore()
  })

  describe('auto-selection (no preferredNodeId)', () => {
    it('fetches a page of uptime-sorted candidates without constraining by node', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [glacierValidator('NodeID-AUTO')]
      })

      const result = await fetchFastStakeValidator(baseParams)

      expect(mockListValidators).toHaveBeenCalledTimes(1)
      expect(mockListValidators).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: SortByOption.UPTIME_PERFORMANCE,
          pageSize: 100,
          minTimeRemaining: 30 * DAY
        })
      )
      const call = mockListValidators.mock.calls[0]?.[0] as
        | { nodeIds?: string }
        | undefined
      expect(call?.nodeIds).toBeUndefined()
      expect(result?.nodeID).toBe('NodeID-AUTO')
    })

    it('skips unreachable validators', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [
          glacierValidator('NodeID-OFFLINE', { reachabilityPercent: 0 }),
          glacierValidator('NodeID-ONLINE')
        ]
      })

      const result = await fetchFastStakeValidator(baseParams)

      expect(result?.nodeID).toBe('NodeID-ONLINE')
    })

    it('skips validators younger than the minimum age', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [
          glacierValidator('NodeID-FRESH', { ageDays: 1 }),
          glacierValidator('NodeID-ESTABLISHED')
        ]
      })

      const result = await fetchFastStakeValidator(baseParams)

      expect(result?.nodeID).toBe('NodeID-ESTABLISHED')
    })

    it('picks randomly among eligible candidates', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [
          glacierValidator('NodeID-FIRST'),
          glacierValidator('NodeID-SECOND')
        ]
      })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        random: () => 0.99
      })

      expect(result?.nodeID).toBe('NodeID-SECOND')
    })

    it('returns undefined when no validator qualifies', async () => {
      mockListValidators.mockResolvedValueOnce({ validators: [] })

      const result = await fetchFastStakeValidator(baseParams)

      expect(result).toBeUndefined()
    })

    it('returns undefined when every candidate is unreachable', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [
          glacierValidator('NodeID-OFFLINE', { reachabilityPercent: 0 })
        ]
      })

      const result = await fetchFastStakeValidator(baseParams)

      expect(result).toBeUndefined()
    })
  })

  describe('preferredNodeId (restake)', () => {
    it('reuses the preferred node and skips the fallback when it still qualifies', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [glacierValidator('NodeID-PREFERRED')]
      })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        preferredNodeId: 'NodeID-PREFERRED'
      })

      expect(mockListValidators).toHaveBeenCalledTimes(1)
      expect(mockListValidators).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeIds: 'NodeID-PREFERRED',
          pageSize: 1
        })
      )
      expect(result?.nodeID).toBe('NodeID-PREFERRED')
    })

    it('falls back to auto-selection when the preferred node no longer qualifies', async () => {
      mockListValidators
        .mockResolvedValueOnce({ validators: [] })
        .mockResolvedValueOnce({ validators: [glacierValidator('NodeID-NEW')] })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        preferredNodeId: 'NodeID-PREFERRED'
      })

      expect(mockListValidators).toHaveBeenCalledTimes(2)
      const fallbackCall = mockListValidators.mock.calls[1]?.[0] as
        | { nodeIds?: string; sortBy?: SortByOption }
        | undefined
      expect(fallbackCall?.nodeIds).toBeUndefined()
      expect(fallbackCall?.sortBy).toBe(SortByOption.UPTIME_PERFORMANCE)
      expect(result?.nodeID).toBe('NodeID-NEW')
    })

    it('falls back to auto-selection when the preferred node is unreachable', async () => {
      mockListValidators
        .mockResolvedValueOnce({
          validators: [
            glacierValidator('NodeID-PREFERRED', { reachabilityPercent: 0 })
          ]
        })
        .mockResolvedValueOnce({ validators: [glacierValidator('NodeID-NEW')] })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        preferredNodeId: 'NodeID-PREFERRED'
      })

      expect(mockListValidators).toHaveBeenCalledTimes(2)
      expect(result?.nodeID).toBe('NodeID-NEW')
    })

    it('falls back to auto-selection when the preferred node is too new', async () => {
      mockListValidators
        .mockResolvedValueOnce({
          validators: [glacierValidator('NodeID-PREFERRED', { ageDays: 1 })]
        })
        .mockResolvedValueOnce({ validators: [glacierValidator('NodeID-NEW')] })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        preferredNodeId: 'NodeID-PREFERRED'
      })

      expect(result?.nodeID).toBe('NodeID-NEW')
    })

    it('returns undefined when both the preferred lookup and auto-select fail', async () => {
      mockListValidators
        .mockResolvedValueOnce({ validators: [] })
        .mockResolvedValueOnce({ validators: [] })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        preferredNodeId: 'NodeID-PREFERRED'
      })

      expect(mockListValidators).toHaveBeenCalledTimes(2)
      expect(result).toBeUndefined()
    })
  })
})
