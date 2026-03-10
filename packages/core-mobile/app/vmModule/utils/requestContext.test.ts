import { RpcRequest } from '@avalabs/vm-module-types'
import { RequestContext } from 'store/rpc/types'
import { getChainIdFromCaip2 } from 'utils/caip2ChainIds'
import { isAvalancheChainId } from 'services/network/utils/isAvalancheNetwork'
import { isInAppRequest } from 'store/rpc/utils/isInAppRequest'
import {
  isInAppAvalancheRequest,
  isToastsAndConfettiEnabled,
  isConfettiEnabled,
  isInAppReview,
  showConfetti
} from './requestContext'

jest.mock('utils/caip2ChainIds', () => ({
  getChainIdFromCaip2: jest.fn()
}))

jest.mock('services/network/utils/isAvalancheNetwork', () => ({
  isAvalancheChainId: jest.fn()
}))

jest.mock('store/rpc/utils/isInAppRequest', () => ({
  isInAppRequest: jest.fn()
}))

const mockGetChainIdFromCaip2 = getChainIdFromCaip2 as jest.MockedFunction<
  typeof getChainIdFromCaip2
>
const mockIsAvalancheChainId = isAvalancheChainId as jest.MockedFunction<
  typeof isAvalancheChainId
>
const mockIsInAppRequest = isInAppRequest as jest.MockedFunction<
  typeof isInAppRequest
>

function makeRequest(
  context: Record<string, unknown> = {},
  chainId = 'eip155:43114'
): RpcRequest {
  return { chainId, context } as unknown as RpcRequest
}

describe('isInAppAvalancheRequest', () => {
  beforeEach(() => {
    mockGetChainIdFromCaip2.mockReturnValue(43114)
    mockIsAvalancheChainId.mockReturnValue(true)
    mockIsInAppRequest.mockReturnValue(true)
  })

  it('returns true when all conditions are met', () => {
    expect(isInAppAvalancheRequest(makeRequest())).toBe(true)
  })

  it('returns false when chain ID cannot be resolved', () => {
    mockGetChainIdFromCaip2.mockReturnValue(undefined)
    expect(isInAppAvalancheRequest(makeRequest())).toBe(false)
  })

  it('returns false when chain is not Avalanche', () => {
    mockIsAvalancheChainId.mockReturnValue(false)
    expect(isInAppAvalancheRequest(makeRequest())).toBe(false)
  })

  it('returns false when request is not in-app', () => {
    mockIsInAppRequest.mockReturnValue(false)
    expect(isInAppAvalancheRequest(makeRequest())).toBe(false)
  })
})

describe('isToastsAndConfettiEnabled', () => {
  it('returns true when TOASTS_AND_CONFETTI_DISABLED is not set', () => {
    expect(isToastsAndConfettiEnabled(makeRequest())).toBe(true)
  })

  it('returns false when TOASTS_AND_CONFETTI_DISABLED is true', () => {
    expect(
      isToastsAndConfettiEnabled(
        makeRequest({ [RequestContext.TOASTS_AND_CONFETTI_DISABLED]: true })
      )
    ).toBe(false)
  })

  it('returns true when TOASTS_AND_CONFETTI_DISABLED is false', () => {
    expect(
      isToastsAndConfettiEnabled(
        makeRequest({ [RequestContext.TOASTS_AND_CONFETTI_DISABLED]: false })
      )
    ).toBe(true)
  })
})

describe('isConfettiEnabled', () => {
  it('returns true when CONFETTI_DISABLED is not set', () => {
    expect(isConfettiEnabled(makeRequest())).toBe(true)
  })

  it('returns false when CONFETTI_DISABLED is true', () => {
    expect(
      isConfettiEnabled(
        makeRequest({ [RequestContext.CONFETTI_DISABLED]: true })
      )
    ).toBe(false)
  })

  it('returns true when CONFETTI_DISABLED is false', () => {
    expect(
      isConfettiEnabled(
        makeRequest({ [RequestContext.CONFETTI_DISABLED]: false })
      )
    ).toBe(true)
  })
})

describe('isInAppReview', () => {
  it('returns false when IN_APP_REVIEW is not set', () => {
    expect(isInAppReview(makeRequest())).toBe(false)
  })

  it('returns true when IN_APP_REVIEW is true', () => {
    expect(
      isInAppReview(makeRequest({ [RequestContext.IN_APP_REVIEW]: true }))
    ).toBe(true)
  })

  it('returns false when IN_APP_REVIEW is false', () => {
    expect(
      isInAppReview(makeRequest({ [RequestContext.IN_APP_REVIEW]: false }))
    ).toBe(false)
  })
})

describe('showConfetti', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    global.confetti = { restart: jest.fn() } as unknown as typeof confetti
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls confetti.restart after 100ms', () => {
    showConfetti()
    expect(global.confetti.restart).not.toHaveBeenCalled()
    jest.advanceTimersByTime(100)
    expect(global.confetti.restart).toHaveBeenCalledTimes(1)
  })
})
