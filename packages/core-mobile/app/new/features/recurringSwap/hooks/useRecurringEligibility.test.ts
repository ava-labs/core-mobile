import { renderHook } from '@testing-library/react-hooks'
import { TokenType } from '@avalabs/vm-module-types'
import { useRecurringEligibility } from './useRecurringEligibility'

// Mock the FusionService.markrRecurring namespace. `checkEligibility` is the
// only method this hook touches; the others must exist on the mock so the
// `markrRecurring` getter still resolves to a non-null object.
const mockCheckEligibility = jest.fn()

jest.mock('features/swap/services/FusionService', () => ({
  __esModule: true,
  default: {
    get markrRecurring() {
      return {
        checkEligibility: mockCheckEligibility,
        quote: jest.fn(),
        prepareFirstFill: jest.fn(),
        listOrders: jest.fn(),
        cancelOrder: jest.fn(),
        getRouterAddress: jest.fn(),
        getRecurringChainInfo: jest.fn()
      }
    }
  }
}))

const mockUseIsFusionServiceReady = jest.fn().mockReturnValue([true])
jest.mock('features/swap/hooks/useZustandStore', () => ({
  useIsFusionServiceReady: () => mockUseIsFusionServiceReady()
}))

// `type: ERC20` is required: the hook resolves the on-chain address via
// `resolveRecurringTokenAddress`, which only returns an address for
// NATIVE/ERC20 tokens. Production `LocalTokenWithBalance` always carries a
// type; omitting it here makes the hook short-circuit to `unsupported-token`
// before ever calling `checkEligibility`.
const usdc = {
  type: TokenType.ERC20,
  address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
  networkChainId: 43114,
  decimals: 6,
  symbol: 'USDC'
}
const wavax = {
  type: TokenType.ERC20,
  address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
  networkChainId: 43114,
  decimals: 18,
  symbol: 'WAVAX'
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseIsFusionServiceReady.mockReturnValue([true])
})

describe('useRecurringEligibility', () => {
  it('delegates to SDK checkEligibility and returns its result for a supported same-chain pair', () => {
    mockCheckEligibility.mockReturnValue({
      eligible: true,
      minimumAmount: '1000000',
      minIntervalSeconds: 300
    })

    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useRecurringEligibility(usdc as any, wavax as any, '0xabc')
    )

    expect(mockCheckEligibility).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceChainId: 43114,
        targetChainId: 43114,
        fromTokenAddress: usdc.address,
        toTokenAddress: wavax.address,
        ownerAddress: '0xabc'
      })
    )
    expect(result.current).toEqual({
      eligible: true,
      minimumAmount: '1000000',
      minIntervalSeconds: 300
    })
  })

  it('returns "no-evm-address" when ownerAddress is undefined (no SDK call)', () => {
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useRecurringEligibility(usdc as any, wavax as any, undefined)
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'no-evm-address'
    })
    expect(mockCheckEligibility).not.toHaveBeenCalled()
  })

  it('returns "unsupported-token" when fromToken has no address (no SDK call)', () => {
    const nativeToken = { networkChainId: 43114, symbol: 'AVAX', decimals: 18 }
    const { result } = renderHook(() =>
      useRecurringEligibility(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nativeToken as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wavax as any,
        '0xabc'
      )
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'unsupported-token'
    })
    expect(mockCheckEligibility).not.toHaveBeenCalled()
  })

  it('returns "unsupported-source-chain" while FusionService is initializing', () => {
    mockUseIsFusionServiceReady.mockReturnValue([false])
    const { result } = renderHook(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useRecurringEligibility(usdc as any, wavax as any, '0xabc')
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'unsupported-source-chain'
    })
    expect(mockCheckEligibility).not.toHaveBeenCalled()
  })

  it('propagates SDK "cross-chain" reason', () => {
    mockCheckEligibility.mockReturnValue({
      eligible: false,
      reason: 'cross-chain'
    })
    const { result } = renderHook(() =>
      useRecurringEligibility(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        usdc as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { ...wavax, networkChainId: 1 } as any,
        '0xabc'
      )
    )
    expect(result.current).toMatchObject({
      eligible: false,
      reason: 'cross-chain'
    })
  })

  it('passes the optional amount through to checkEligibility', () => {
    mockCheckEligibility.mockReturnValue({
      eligible: false,
      reason: 'amount-below-minimum'
    })
    renderHook(() =>
      useRecurringEligibility(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        usdc as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wavax as any,
        '0xabc',
        500_000n
      )
    )
    expect(mockCheckEligibility).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 500_000n })
    )
  })
})
