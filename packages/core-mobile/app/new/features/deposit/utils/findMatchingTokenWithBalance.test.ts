import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { findMatchingTokenWithBalance } from './findMatchingTokenWithBalance'

describe('findMatchingTokenWithBalance', () => {
  const mockNativeToken: LocalTokenWithBalance = {
    type: TokenType.NATIVE,
    symbol: 'AVAX',
    name: 'Avalanche',
    balance: BigInt(1000000000000000000),
    balanceInCurrency: 100,
    decimals: 18,
    priceInCurrency: 20,
    localId: 'native-avax'
  } as LocalTokenWithBalance

  const mockERC20Token: LocalTokenWithBalance = {
    type: TokenType.ERC20,
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    balance: BigInt(1000000),
    balanceInCurrency: 100,
    decimals: 6,
    priceInCurrency: 1,
    localId: 'erc20-usdc'
  } as LocalTokenWithBalance

  const mockWETHToken: LocalTokenWithBalance = {
    type: TokenType.ERC20,
    symbol: 'WETH.e',
    name: 'Wrapped Ether',
    address: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB',
    balance: BigInt(500000000000000000),
    balanceInCurrency: 1500,
    decimals: 18,
    priceInCurrency: 3000,
    localId: 'erc20-weth'
  } as LocalTokenWithBalance

  const mockTokenList: LocalTokenWithBalance[] = [
    mockNativeToken,
    mockERC20Token,
    mockWETHToken
  ]

  describe('Native token matching', () => {
    it('should find native token by symbol (exact case)', () => {
      const result = findMatchingTokenWithBalance(
        { symbol: 'AVAX', contractAddress: undefined },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('AVAX')
      expect(result?.type).toBe(TokenType.NATIVE)
    })

    it('should find native token by symbol (case insensitive)', () => {
      const result = findMatchingTokenWithBalance(
        { symbol: 'avax', contractAddress: undefined },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('AVAX')
    })

    it('should find native token by symbol (mixed case)', () => {
      const result = findMatchingTokenWithBalance(
        { symbol: 'AvAx', contractAddress: undefined },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('AVAX')
    })

    it('should not match native token if contractAddress is provided', () => {
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'AVAX',
          contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        },
        mockTokenList
      )

      // Should match ERC20 token by address, not native token
      expect(result?.symbol).toBe('USDC')
      expect(result?.type).toBe(TokenType.ERC20)
    })
  })

  describe('ERC20 token matching', () => {
    it('should find ERC20 token by contract address (exact case)', () => {
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'USDC',
          contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('USDC')
      expect(result?.type).toBe(TokenType.ERC20)
      // @ts-ignore
      expect((result as NetworkContractToken).address).toBe(
        '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
      )
    })

    it('should find ERC20 token by contract address (case insensitive)', () => {
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'USDC',
          contractAddress: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
        },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('USDC')
    })

    it('should find ERC20 token by contract address regardless of symbol', () => {
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'WRONG_SYMBOL',
          contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('USDC')
    })

    it('should find WETH.e token by contract address', () => {
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'WETH.e',
          contractAddress: '0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB'
        },
        mockTokenList
      )

      expect(result).toBeDefined()
      expect(result?.symbol).toBe('WETH.e')
    })
  })

  describe('No match cases', () => {
    it('should return undefined when native token symbol does not match', () => {
      const result = findMatchingTokenWithBalance(
        { symbol: 'BTC', contractAddress: undefined },
        mockTokenList
      )

      expect(result).toBeUndefined()
    })

    it('should return undefined when contract address does not match', () => {
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'USDC',
          contractAddress: '0x0000000000000000000000000000000000000000'
        },
        mockTokenList
      )

      expect(result).toBeUndefined()
    })

    it('should return undefined when searching in empty list', () => {
      const result = findMatchingTokenWithBalance(
        { symbol: 'AVAX', contractAddress: undefined },
        []
      )

      expect(result).toBeUndefined()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty symbol', () => {
      const result = findMatchingTokenWithBalance(
        { symbol: '', contractAddress: undefined },
        mockTokenList
      )

      expect(result).toBeUndefined()
    })

    it('should handle only ERC20 tokens in list', () => {
      const erc20OnlyList = [mockERC20Token, mockWETHToken]

      const result = findMatchingTokenWithBalance(
        { symbol: 'AVAX', contractAddress: undefined },
        erc20OnlyList
      )

      expect(result).toBeUndefined()
    })

    it('should handle only native tokens in list', () => {
      const nativeOnlyList = [mockNativeToken]

      const result = findMatchingTokenWithBalance(
        {
          symbol: 'USDC',
          contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        },
        nativeOnlyList
      )

      expect(result).toBeUndefined()
    })

    it('should return first match when multiple tokens have same symbol', () => {
      const duplicateToken: LocalTokenWithBalance = {
        ...mockNativeToken,
        localId: 'native-avax-2'
      }

      const listWithDuplicates = [
        mockNativeToken,
        duplicateToken,
        mockERC20Token
      ]

      const result = findMatchingTokenWithBalance(
        { symbol: 'AVAX', contractAddress: undefined },
        listWithDuplicates
      )

      expect(result).toBeDefined()
      expect(result?.localId).toBe('native-avax') // First one
    })
  })

  describe('Priority: contract address over symbol', () => {
    it('should prioritize contract address matching over symbol', () => {
      // Even if symbol matches a native token, if contractAddress is provided,
      // it should match by address
      const result = findMatchingTokenWithBalance(
        {
          symbol: 'AVAX', // This matches native token
          contractAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E' // But this matches USDC
        },
        mockTokenList
      )

      // Should match USDC by address, not AVAX by symbol
      expect(result).toBeDefined()
      expect(result?.symbol).toBe('USDC')
      expect(result?.type).toBe(TokenType.ERC20)
    })
  })
})
