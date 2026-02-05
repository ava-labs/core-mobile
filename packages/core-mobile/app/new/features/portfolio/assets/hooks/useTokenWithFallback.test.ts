import { renderHook } from '@testing-library/react-hooks'
import { LocalTokenWithBalance } from 'store/balance/types'
import { TokenType } from '@avalabs/vm-module-types'
import { useTokenWithFallback } from './useTokenWithFallback'

// Mock useSearchableTokenList
let mockFilteredTokenList: LocalTokenWithBalance[] = []
let mockFilteredTokenListWithZeroBalance: LocalTokenWithBalance[] = []

jest.mock('common/hooks/useSearchableTokenList', () => ({
  useSearchableTokenList: jest.fn(({ hideZeroBalance = true }) => ({
    filteredTokenList: hideZeroBalance
      ? mockFilteredTokenList
      : mockFilteredTokenListWithZeroBalance
  }))
}))

// Helper to create a mock token
const createMockToken = (
  localId: string,
  chainId: number,
  balance: bigint = 1000n
): LocalTokenWithBalance =>
  ({
    localId,
    networkChainId: chainId,
    balance,
    balanceInCurrency: balance > 0n ? 100 : 0,
    balanceDisplayValue: balance.toString(),
    balanceCurrencyDisplayValue: '$100',
    priceInCurrency: 1,
    marketCap: 1000000,
    change24: 0,
    vol24: 0,
    name: `Token ${localId}`,
    symbol: 'TKN',
    decimals: 18,
    type: TokenType.ERC20,
    address: '0x1234567890123456789012345678901234567890'
  } as LocalTokenWithBalance)

// Helper to setup mock lists
const setupMockLists = (
  filteredList: LocalTokenWithBalance[],
  zeroBalanceList: LocalTokenWithBalance[]
): void => {
  mockFilteredTokenList = filteredList
  mockFilteredTokenListWithZeroBalance = zeroBalanceList
}

describe('useTokenWithFallback', () => {
  const TOKEN_LOCAL_ID = 'token-123'
  const CHAIN_ID = '43114'
  const CHAIN_ID_NUM = 43114

  beforeEach(() => {
    // Reset mock lists before each test
    setupMockLists([], [])
  })

  describe('when token has balance', () => {
    it('should return the token from the filtered list', () => {
      const tokenWithBalance = createMockToken(TOKEN_LOCAL_ID, CHAIN_ID_NUM)
      setupMockLists([tokenWithBalance], [tokenWithBalance])

      const { result } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: CHAIN_ID
        })
      )

      expect(result.current.token).toEqual(tokenWithBalance)
      expect(result.current.hasSeenToken).toBe(true)
    })

    it('should return undefined when token is not in either list', () => {
      setupMockLists([], [])

      const { result } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: CHAIN_ID
        })
      )

      expect(result.current.token).toBeUndefined()
      expect(result.current.hasSeenToken).toBe(false)
    })
  })

  describe('when token balance becomes zero (after sending max)', () => {
    it('should fall back to zero balance list after token was previously seen', () => {
      const tokenWithBalance = createMockToken(
        TOKEN_LOCAL_ID,
        CHAIN_ID_NUM,
        1000n
      )
      const tokenWithZeroBalance = createMockToken(
        TOKEN_LOCAL_ID,
        CHAIN_ID_NUM,
        0n
      )

      // Initial render with token having balance
      setupMockLists([tokenWithBalance], [tokenWithBalance])

      const { result, rerender } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: CHAIN_ID
        })
      )

      // Token should be found initially
      expect(result.current.token).toEqual(tokenWithBalance)
      expect(result.current.hasSeenToken).toBe(true)

      // Simulate sending max balance - token removed from filtered list
      // but still present in zero balance list
      setupMockLists([], [tokenWithZeroBalance])
      rerender()

      // Token should still be available via fallback
      expect(result.current.token).toEqual(tokenWithZeroBalance)
      expect(result.current.hasSeenToken).toBe(true)
    })

    it('should not return token from zero balance list if never seen before', () => {
      const tokenWithZeroBalance = createMockToken(
        TOKEN_LOCAL_ID,
        CHAIN_ID_NUM,
        0n
      )

      // Token only in zero balance list, not in filtered list
      setupMockLists([], [tokenWithZeroBalance])

      const { result } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: CHAIN_ID
        })
      )

      // Should NOT return the token since we've never seen it
      // This prevents showing tokens that user navigated to incorrectly
      expect(result.current.token).toBeUndefined()
      expect(result.current.hasSeenToken).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle undefined localId', () => {
      const tokenWithBalance = createMockToken(TOKEN_LOCAL_ID, CHAIN_ID_NUM)
      setupMockLists([tokenWithBalance], [tokenWithBalance])

      const { result } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: undefined,
          chainId: CHAIN_ID
        })
      )

      expect(result.current.token).toBeUndefined()
    })

    it('should handle undefined chainId', () => {
      const tokenWithBalance = createMockToken(TOKEN_LOCAL_ID, CHAIN_ID_NUM)
      setupMockLists([tokenWithBalance], [tokenWithBalance])

      const { result } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: undefined
        })
      )

      expect(result.current.token).toBeUndefined()
    })

    it('should match token by both localId AND chainId', () => {
      const correctToken = createMockToken(TOKEN_LOCAL_ID, CHAIN_ID_NUM)
      const wrongChainToken = createMockToken(TOKEN_LOCAL_ID, 1) // Different chain
      const wrongIdToken = createMockToken('wrong-id', CHAIN_ID_NUM)

      setupMockLists(
        [wrongChainToken, wrongIdToken, correctToken],
        [wrongChainToken, wrongIdToken, correctToken]
      )

      const { result } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: CHAIN_ID
        })
      )

      expect(result.current.token).toEqual(correctToken)
    })

    it('should prefer token with balance over zero balance token', () => {
      const tokenWithBalance = createMockToken(
        TOKEN_LOCAL_ID,
        CHAIN_ID_NUM,
        1000n
      )
      const tokenWithZeroBalance = createMockToken(
        TOKEN_LOCAL_ID,
        CHAIN_ID_NUM,
        0n
      )

      // Setup with token having balance in filtered list
      setupMockLists([tokenWithBalance], [tokenWithZeroBalance])

      const { result, rerender } = renderHook(() =>
        useTokenWithFallback({
          tokens: [],
          localId: TOKEN_LOCAL_ID,
          chainId: CHAIN_ID
        })
      )

      expect(result.current.token?.balance).toBe(1000n)

      // Even after seeing token, if it's in filtered list, use that version
      rerender()

      expect(result.current.token?.balance).toBe(1000n)
    })
  })
})
