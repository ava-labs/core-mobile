import { renderHook } from '@testing-library/react-hooks'
import { NodeValidator } from 'types/earn'
import { setDelegateNodeSelection } from '../store'
import {
  RESTAKE_NODE_ENDING_ERROR,
  useAdvancedReviewSource
} from './useAdvancedReviewSource'

const NOW_MS = 1_800_000_000_000
const YEAR_S = 365 * 24 * 60 * 60

let mockParams: { restakeNodeId?: string } = {}
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockParams
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() })
}))

let mockNodesResult: {
  data: { validators: NodeValidator[] } | undefined
  isFetching: boolean
  error: Error | null
} = { data: undefined, isFetching: false, error: null }
jest.mock('hooks/earn/useNodes', () => ({
  useNodes: () => mockNodesResult
}))

jest.mock('hooks/earn/useStakeAmount', () => {
  const { TokenUnit } = require('@avalabs/core-utils-sdk')
  const amount = new TokenUnit(25_000_000_000n, 9, 'AVAX')
  return { useStakeAmount: () => [amount, jest.fn()] }
})

jest.mock('hooks/time/useNow', () => ({ useNow: () => 1_800_000_000_000 }))

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({})
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => true
}))
jest.mock('store/posthog', () => ({
  selectIsDelegationFeeBlocked: () => true,
  selectDelegationFeeRate: () => 0
}))
jest.mock('services/earn/utils', () => ({
  getMinimumStakeDurationMs: () => 24 * 60 * 60 * 1000
}))

let mockMaxAmountNAvax = 10n ** 18n
jest.mock('./useSelectedDelegateNodeLimits', () => {
  const { TokenUnit } = require('@avalabs/core-utils-sdk')
  return {
    getDelegateNodeLimits: (node: { endTime: string }) => ({
      maxAmount: new TokenUnit(mockMaxAmountNAvax, 9, 'AVAX'),
      maxEndDate: new Date(Number(node.endTime) * 1000)
    })
  }
})

const makeNode = (overrides: Partial<NodeValidator>): NodeValidator =>
  ({
    nodeID: 'NodeID-A',
    startTime: String(NOW_MS / 1000 - YEAR_S),
    endTime: String(NOW_MS / 1000 + YEAR_S),
    delegationFee: '2',
    uptime: '85.5',
    weight: '2000000000000',
    delegatorWeight: '0',
    ...overrides
  } as unknown as NodeValidator)

describe('useAdvancedReviewSource uptime', () => {
  beforeEach(() => {
    mockParams = {}
    mockNodesResult = { data: undefined, isFetching: false, error: null }
    mockMaxAmountNAvax = 10n ** 18n
    setDelegateNodeSelection([], 0)
  })

  it('carries the picked node uptime on the fresh delegate path', () => {
    setDelegateNodeSelection([makeNode({ uptime: '85.5' })], 0)

    const { result } = renderHook(() => useAdvancedReviewSource())

    expect(result.current.validator).toEqual({
      nodeID: 'NodeID-A',
      endTime: String(NOW_MS / 1000 + YEAR_S),
      delegationFee: '2',
      uptime: '85.5'
    })
  })

  it('carries the restake node uptime resolved from the validator set', () => {
    mockParams = { restakeNodeId: 'NodeID-R' }
    mockNodesResult = {
      data: {
        validators: [makeNode({ nodeID: 'NodeID-R', uptime: '60.11' })]
      },
      isFetching: false,
      error: null
    }

    const { result } = renderHook(() => useAdvancedReviewSource())

    expect(result.current.validator?.nodeID).toBe('NodeID-R')
    expect(result.current.validator?.uptime).toBe('60.11')
    expect(result.current.error).toBeNull()
  })

  it('surfaces no validator (so no uptime alert) when the restake node is full', () => {
    mockParams = { restakeNodeId: 'NodeID-R' }
    mockMaxAmountNAvax = 0n
    mockNodesResult = {
      data: {
        validators: [makeNode({ nodeID: 'NodeID-R', uptime: '60.11' })]
      },
      isFetching: false,
      error: null
    }

    const { result } = renderHook(() => useAdvancedReviewSource())

    expect(result.current.validator).toBeUndefined()
    expect(result.current.error?.message).toBe(
      'The original node no longer has enough delegation capacity'
    )
  })

  it('surfaces no validator (so no uptime alert) when the restake node is ending', () => {
    mockParams = { restakeNodeId: 'NodeID-R' }
    mockNodesResult = {
      data: {
        validators: [
          makeNode({
            nodeID: 'NodeID-R',
            uptime: '60.11',
            // 60s left, inside the ending cutoff (buffer + min duration)
            endTime: String(NOW_MS / 1000 + 60)
          })
        ]
      },
      isFetching: false,
      error: null
    }

    const { result } = renderHook(() => useAdvancedReviewSource())

    expect(result.current.validator).toBeUndefined()
    expect(result.current.error).toBe(RESTAKE_NODE_ENDING_ERROR)
  })
})
