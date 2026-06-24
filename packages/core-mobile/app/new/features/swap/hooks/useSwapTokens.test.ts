import { renderHook } from '@testing-library/react-hooks'
import { ChainId } from '@avalabs/core-chains-sdk'
import { getCaip2ChainId } from 'utils/caip2ChainIds'
import { AVAX_P_ID, AVAX_X_ID } from 'services/balance/const'
import { useSwapTokens } from './useSwapTokens'

// react-query is mocked so we can feed the hook a deterministic "to" token
// list (a single native AVAX asset) without standing up the Fusion service.
jest.mock('@tanstack/react-query', () => ({
  useInfiniteQuery: jest.fn()
}))

// useSelector is mocked to simply invoke the (also-mocked) selector.
jest.mock('react-redux', () => ({
  useSelector: (fn: () => unknown) => fn()
}))

jest.mock('store/account', () => ({
  selectActiveAccount: () => ({ id: 'acc-1', index: 0, walletId: 'w1' }),
  selectActiveAccountHasSolanaAddress: () => false
}))
jest.mock('store/posthog', () => ({
  selectIsSolanaSwapBlocked: () => false
}))
jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => false
}))

jest.mock('./useZustandStore', () => ({
  useIsFusionServiceReady: () => [true],
  useSwapSelectedFromToken: () => [undefined]
}))

jest.mock(
  'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount',
  () => ({
    useTokensWithBalanceByNetworkForAccount: jest.fn()
  })
)

jest.mock('../services/FusionService', () => ({
  __esModule: true,
  default: {}
}))

// Keep the real TokenType enum values but stub the cross-service dedupe so the
// asset list passes through untouched.
jest.mock('@avalabs/fusion-sdk', () => ({
  TokenType: { NATIVE: 'NATIVE', ERC20: 'ERC20', SPL: 'SPL' },
  dedupeBridgeableAssets: (assets: unknown[]) => assets
}))

const { useInfiniteQuery } = jest.requireMock('@tanstack/react-query')
const { useTokensWithBalanceByNetworkForAccount } = jest.requireMock(
  'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
)

const nativeAvaxAsset = {
  type: 'NATIVE',
  symbol: 'AVAX',
  name: 'Avalanche',
  decimals: 18,
  logoUri: 'https://example.com/avax.png'
}

const mockToTokensQuery = (): void => {
  useInfiniteQuery.mockReturnValue({
    data: { pages: [{ assets: [nativeAvaxAsset], meta: { hasMore: false } }] },
    isLoading: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false
  })
}

const portfolioNativeToken = (localId: string, chainId: number): unknown => ({
  type: 'NATIVE',
  symbol: 'AVAX',
  name: 'Avalanche',
  localId,
  internalId: localId,
  networkChainId: chainId,
  balance: 5_000_000_000n, // 5 AVAX at 9 decimals
  balanceDisplayValue: '5',
  balanceInCurrency: 100,
  priceInCurrency: 20
})

describe('useSwapTokens balance merge', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockToTokensQuery()
  })

  it('merges the P-Chain native balance (AVAX-P localId) into the destination token', () => {
    useTokensWithBalanceByNetworkForAccount.mockReturnValue({
      tokens: [portfolioNativeToken(AVAX_P_ID, ChainId.AVALANCHE_P)],
      isLoading: false
    })

    const { result } = renderHook(() =>
      useSwapTokens(getCaip2ChainId(ChainId.AVALANCHE_P))
    )

    const token = result.current.tokens[0]
    expect(token?.balance).toBe(5_000_000_000n)
    expect(token?.balanceDisplayValue).toBe('5')
    expect(token?.balanceInCurrency).toBe(100)
  })

  it('merges the X-Chain native balance (AVAX-X localId) into the destination token', () => {
    useTokensWithBalanceByNetworkForAccount.mockReturnValue({
      tokens: [portfolioNativeToken(AVAX_X_ID, ChainId.AVALANCHE_X)],
      isLoading: false
    })

    const { result } = renderHook(() =>
      useSwapTokens(getCaip2ChainId(ChainId.AVALANCHE_X))
    )

    const token = result.current.tokens[0]
    expect(token?.balance).toBe(5_000_000_000n)
    expect(token?.balanceDisplayValue).toBe('5')
  })

  it('shows a zero balance when the portfolio has no matching P/X entry', () => {
    useTokensWithBalanceByNetworkForAccount.mockReturnValue({
      tokens: [],
      isLoading: false
    })

    const { result } = renderHook(() =>
      useSwapTokens(getCaip2ChainId(ChainId.AVALANCHE_P))
    )

    expect(result.current.tokens[0]?.balance).toBe(0n)
  })
})
