import {
  ActiveValidatorDetails,
  Network,
  SortByOption
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
      geolocation: null
    }

    // Only `nodeID` and `endTime` are surfaced — uptime and delegation fee
    // are intentionally dropped to keep the shape flow-neutral.
    expect(toFastStakeValidator(glacier)).toEqual({
      nodeID: 'NodeID-A',
      endTime: '2000000'
    })
  })
})

describe('fetchFastStakeValidator', () => {
  const baseParams = {
    isTestnet: false,
    stakeAmountNAvax: '25000000000',
    minTimeRemainingSeconds: 30 * 24 * 60 * 60
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
    it('issues a single sorted lookup and returns the top candidate', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [
          {
            validationStatus: 'active',
            nodeId: 'NodeID-AUTO',
            endTimestamp: 2_000_000,
            uptimePerformance: 99
          } as unknown as ActiveValidatorDetails
        ]
      })

      const result = await fetchFastStakeValidator(baseParams)

      expect(mockListValidators).toHaveBeenCalledTimes(1)
      expect(mockListValidators).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: SortByOption.UPTIME_PERFORMANCE,
          pageSize: 1
        })
      )
      // Should not be using the preferred-node lookup shape.
      const call = mockListValidators.mock.calls[0]?.[0] as
        | { nodeIds?: string }
        | undefined
      expect(call?.nodeIds).toBeUndefined()
      expect(result?.nodeID).toBe('NodeID-AUTO')
    })

    it('returns undefined when no validator qualifies', async () => {
      mockListValidators.mockResolvedValueOnce({ validators: [] })

      const result = await fetchFastStakeValidator(baseParams)

      expect(result).toBeUndefined()
    })
  })

  describe('preferredNodeId (restake)', () => {
    it('reuses the preferred node and skips the fallback when it still qualifies', async () => {
      mockListValidators.mockResolvedValueOnce({
        validators: [
          {
            validationStatus: 'active',
            nodeId: 'NodeID-PREFERRED',
            endTimestamp: 2_000_000,
            uptimePerformance: 98
          } as unknown as ActiveValidatorDetails
        ]
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
        // Preferred lookup: empty
        .mockResolvedValueOnce({ validators: [] })
        // Auto-select fallback: a different node qualifies
        .mockResolvedValueOnce({
          validators: [
            {
              validationStatus: 'active',
              nodeId: 'NodeID-NEW',
              endTimestamp: 2_000_000,
              uptimePerformance: 99
            } as unknown as ActiveValidatorDetails
          ]
        })

      const result = await fetchFastStakeValidator({
        ...baseParams,
        preferredNodeId: 'NodeID-PREFERRED'
      })

      expect(mockListValidators).toHaveBeenCalledTimes(2)
      // Fallback call should not constrain by nodeIds — that's what makes
      // it an auto-select rather than a constrained lookup.
      const fallbackCall = mockListValidators.mock.calls[1]?.[0] as
        | { nodeIds?: string; sortBy?: SortByOption }
        | undefined
      expect(fallbackCall?.nodeIds).toBeUndefined()
      expect(fallbackCall?.sortBy).toBe(SortByOption.UPTIME_PERFORMANCE)
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
