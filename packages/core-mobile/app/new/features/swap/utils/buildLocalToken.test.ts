/* eslint-disable @typescript-eslint/no-explicit-any */
import { TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { LocalTokenWithBalance } from 'store/balance/types'
import { tokenIds } from 'consts/tokenIds'
import { TokenInfo } from 'common/hooks/useTokenLookup'
import { buildLocalToken } from './buildLocalToken'

const AVAX_CAIP2 = 'eip155:43114'
const ETH_CAIP2 = 'eip155:1'
const SOL_CAIP2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'

const makeTokenInfo = (overrides: Partial<TokenInfo> = {}): TokenInfo => ({
  internalId: 'some-token',
  isNative: false,
  name: 'Some Token',
  symbol: 'SOME',
  platforms: {},
  ...overrides
})

const makeBalanceToken = (
  overrides: Partial<LocalTokenWithBalance> = {}
): LocalTokenWithBalance =>
  ({
    type: TokenType.ERC20,
    internalId: 'some-token',
    networkChainId: ChainId.AVALANCHE_MAINNET_ID,
    symbol: 'SOME',
    name: 'Some Token',
    logoUri: 'https://example.com/some.png',
    balance: 1000n,
    balanceInCurrency: 5,
    priceInCurrency: 0.005,
    ...overrides
  } as LocalTokenWithBalance)

describe('buildLocalToken', () => {
  describe('native token decimals override', () => {
    it('uses NATIVE_DECIMALS for AVAX when balanceData is native', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.AVAX,
        isNative: true,
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 6 } } // wrong decimals – should be overridden
      })
      const balanceData = makeBalanceToken({
        type: TokenType.NATIVE,
        internalId: tokenIds.AVAX
      })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.decimals).toBe(18)
    })

    it('uses NATIVE_DECIMALS for SOL when tokenInfo.isNative is true', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.SOL,
        isNative: true,
        meta: { logoUri: null, decimals: { [SOL_CAIP2]: 1 } } // wrong decimals – should be overridden
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: SOL_CAIP2,
        chainId: ChainId.SOLANA_MAINNET_ID
      }) as any

      expect(result.decimals).toBe(9)
    })

    it('uses NATIVE_DECIMALS for ETH (18)', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.ETH,
        isNative: true
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: ETH_CAIP2,
        chainId: ChainId.ETHEREUM_HOMESTEAD
      }) as any

      expect(result.decimals).toBe(18)
    })

    it('overrides AVAX to 9 decimals on X-Chain (nAVAX) and renders the balance correctly', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.AVAX,
        isNative: true
      })
      const balanceData = makeBalanceToken({
        type: TokenType.NATIVE,
        internalId: tokenIds.AVAX,
        networkChainId: ChainId.AVALANCHE_X,
        balance: 411616842n // 0.411616842 AVAX at 9 decimals
      })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: 'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
        chainId: ChainId.AVALANCHE_X
      }) as any

      expect(result.decimals).toBe(9)
      // an 18-decimal interpretation would render ~0; 9 decimals renders ~0.4116
      expect(result.balanceDisplayValue).toBe('0.4116')
    })

    it('overrides AVAX to 9 decimals on P-Chain (nAVAX)', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.AVAX,
        isNative: true
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
        chainId: ChainId.AVALANCHE_P
      }) as any

      expect(result.decimals).toBe(9)
    })

    it('falls through to meta decimals when native internalId is not in NATIVE_DECIMALS', () => {
      const tokenInfo = makeTokenInfo({
        internalId: 'NATIVE-unknown',
        isNative: true,
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 12 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.decimals).toBe(12)
    })
  })

  describe('address selection', () => {
    it('returns empty address for native token (balanceData.type NATIVE)', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.AVAX,
        isNative: true,
        platforms: { [AVAX_CAIP2]: '0xsome-native-address' }
      })
      const balanceData = makeBalanceToken({
        type: TokenType.NATIVE,
        internalId: tokenIds.AVAX
      })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.address).toBe('')
    })

    it('returns platform address for non-native token', () => {
      const address = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
      const tokenInfo = makeTokenInfo({
        platforms: { [AVAX_CAIP2]: address },
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 6 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.address).toBe(address)
    })

    it('returns empty string when platform is null', () => {
      const tokenInfo = makeTokenInfo({
        platforms: null,
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 6 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.address).toBe('')
    })

    it('returns empty string when caip2Id is not in platforms', () => {
      const tokenInfo = makeTokenInfo({
        platforms: { [ETH_CAIP2]: '0xabc' }, // only ETH, not AVAX
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 6 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.address).toBe('')
    })
  })

  describe('non-native decimals selection', () => {
    it('uses meta.decimals for the given caip2Id', () => {
      const tokenInfo = makeTokenInfo({
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 6, [ETH_CAIP2]: 8 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.decimals).toBe(6)
    })

    it('defaults to 18 when meta.decimals is null', () => {
      const tokenInfo = makeTokenInfo({
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: { logoUri: null, decimals: null }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.decimals).toBe(18)
    })

    it('defaults to 18 when meta is absent', () => {
      const tokenInfo = makeTokenInfo({
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: null
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      }) as any

      expect(result.decimals).toBe(18)
    })
  })

  describe('symbol / name / logoUri preference', () => {
    it('prefers balanceData symbol and name over tokenInfo', () => {
      const tokenInfo = makeTokenInfo({ symbol: 'API-SYM', name: 'API Name' })
      const balanceData = makeBalanceToken({
        internalId: tokenInfo.internalId,
        symbol: 'BAL-SYM',
        name: 'Balance Name'
      })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.symbol).toBe('BAL-SYM')
      expect(result.name).toBe('Balance Name')
    })

    it('falls back to tokenInfo symbol and name when no balanceData matches', () => {
      const tokenInfo = makeTokenInfo({
        symbol: 'API-SYM',
        name: 'API Name',
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 18 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.symbol).toBe('API-SYM')
      expect(result.name).toBe('API Name')
    })

    it('prefers balanceData logoUri over tokenInfo meta.logoUri', () => {
      const tokenInfo = makeTokenInfo({
        internalId: 'shared-id',
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: { logoUri: 'https://api-logo.png', decimals: null }
      })
      const balanceData = makeBalanceToken({
        internalId: 'shared-id',
        logoUri: 'https://balance-logo.png'
      })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.logoUri).toBe('https://balance-logo.png')
    })

    it('falls back to tokenInfo meta.logoUri when no balanceData', () => {
      const tokenInfo = makeTokenInfo({
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: { logoUri: 'https://api-logo.png', decimals: null }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.logoUri).toBe('https://api-logo.png')
    })
  })

  describe('chainId is forwarded', () => {
    it('sets networkChainId from the chainId argument', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.ETH,
        isNative: true
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: ETH_CAIP2,
        chainId: ChainId.ETHEREUM_HOMESTEAD
      })

      expect(result.networkChainId).toBe(ChainId.ETHEREUM_HOMESTEAD)
    })
  })

  describe('internalId selection', () => {
    it('uses internalId from matched balanceData', () => {
      const tokenInfo = makeTokenInfo({ internalId: 'shared-id' })
      const balanceData = makeBalanceToken({ internalId: 'shared-id' })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.internalId).toBe('shared-id')
    })

    it('falls back to tokenInfo internalId when no matching balanceData', () => {
      const tokenInfo = makeTokenInfo({
        internalId: 'tokeninfo-id',
        platforms: { [AVAX_CAIP2]: '0xtoken' },
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 18 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.internalId).toBe('tokeninfo-id')
    })
  })

  describe('contractType resolution', () => {
    // The lookup API doesn't return contractType, so buildLocalToken passes
    // null to mapApiTokenToLocal, which derives the token type from the
    // caip2Id namespace.
    it('resolves to SPL for a non-native token on a Solana caip2Id', () => {
      const tokenInfo = makeTokenInfo({
        platforms: {
          [SOL_CAIP2]: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        },
        meta: { logoUri: null, decimals: { [SOL_CAIP2]: 6 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: SOL_CAIP2,
        chainId: ChainId.SOLANA_MAINNET_ID
      })

      expect(result.type).toBe(TokenType.SPL)
    })

    it('resolves to ERC20 for a non-native token on an Avalanche caip2Id', () => {
      const tokenInfo = makeTokenInfo({
        platforms: {
          [AVAX_CAIP2]: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        },
        meta: { logoUri: null, decimals: { [AVAX_CAIP2]: 6 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.type).toBe(TokenType.ERC20)
    })

    it('resolves to ERC20 for a non-native token on an Ethereum caip2Id', () => {
      const tokenInfo = makeTokenInfo({
        platforms: {
          [ETH_CAIP2]: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        },
        meta: { logoUri: null, decimals: { [ETH_CAIP2]: 18 } }
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: ETH_CAIP2,
        chainId: ChainId.ETHEREUM_HOMESTEAD
      })

      expect(result.type).toBe(TokenType.ERC20)
    })

    it('resolves to NATIVE for a native token regardless of caip2Id', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.SOL,
        isNative: true
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: SOL_CAIP2,
        chainId: ChainId.SOLANA_MAINNET_ID
      })

      expect(result.type).toBe(TokenType.NATIVE)
    })
  })

  describe('balance data integration', () => {
    it('merges balance from matching accountToken', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.AVAX,
        isNative: true
      })
      const balanceData = makeBalanceToken({
        type: TokenType.NATIVE,
        internalId: tokenIds.AVAX,
        balance: 5000000000000000000n,
        balanceInCurrency: 250,
        priceInCurrency: 50
      })

      const result = buildLocalToken({
        accountTokens: [balanceData],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.balance).toBe(5000000000000000000n)
      expect(result.balanceInCurrency).toBe(250)
      expect(result.priceInCurrency).toBe(50)
    })

    it('uses zero balance defaults when no accountToken matches', () => {
      const tokenInfo = makeTokenInfo({
        internalId: tokenIds.AVAX,
        isNative: true
      })

      const result = buildLocalToken({
        accountTokens: [],
        tokenInfo,
        caip2Id: AVAX_CAIP2,
        chainId: ChainId.AVALANCHE_MAINNET_ID
      })

      expect(result.balance).toBe(0n)
      expect(result.balanceInCurrency).toBe(0)
      expect(result.priceInCurrency).toBe(0)
    })
  })
})
