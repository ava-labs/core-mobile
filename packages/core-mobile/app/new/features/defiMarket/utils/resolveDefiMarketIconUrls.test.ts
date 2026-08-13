import Big from 'big.js'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import { TokenInfo } from 'common/hooks/useTokenLookup'
import { DefiMarket, MarketNames } from '../types'
import { resolveDefiMarketIconUrls } from './resolveDefiMarketIconUrls'

const CAIP2_ID = 'eip155:43114'
const ADDRESS = '0xAbCdEf0000000000000000000000000000000A'

const createMockMarket = (overrides: Partial<DefiMarket> = {}): DefiMarket => ({
  marketName: MarketNames.aave,
  network: {} as DefiMarket['network'],
  asset: {
    mintTokenAddress: '0xMintToken',
    assetName: 'Test Asset',
    decimals: 18,
    iconUrl: undefined,
    symbol: 'TEST',
    contractAddress: ADDRESS,
    mintTokenBalance: {
      balance: 0n,
      balanceValue: {
        value: new Big(0),
        valueString: '0',
        currencyCode: CurrencyCode.USD
      },
      price: {
        value: new Big(0),
        valueString: '0',
        currencyCode: CurrencyCode.USD
      }
    }
  },
  type: 'lending',
  supplyApyPercent: 5,
  historicalApyPercent: undefined,
  borrowApyPercent: 8,
  historicalBorrowApyPercent: undefined,
  borrowingEnabled: true,
  supplyCapReached: false,
  totalDeposits: undefined,
  uniqueMarketId: 'test-market',
  canBeUsedAsCollateral: true,
  usageAsCollateralEnabledOnUser: true,
  ...overrides
})

const createMockTokenInfo = (logoUri: string | null): TokenInfo => ({
  internalId: 'internal-id',
  platforms: null,
  isNative: false,
  name: 'Test',
  symbol: 'TEST',
  meta: { logoUri, decimals: null }
})

describe('resolveDefiMarketIconUrls', () => {
  it('resolves iconUrl for an ERC-20 market from the lookup map', () => {
    const market = createMockMarket()
    const tokenInfoByKey = {
      [`${CAIP2_ID}-${ADDRESS.toLowerCase()}`]: createMockTokenInfo(
        'https://example.com/logo.png'
      )
    }

    const [result] = resolveDefiMarketIconUrls([market], {
      caip2Id: CAIP2_ID,
      tokenInfoByKey
    })

    expect(result?.asset.iconUrl).toBe('https://example.com/logo.png')
  })

  it('leaves the market unchanged when the address is not in the lookup map', () => {
    const market = createMockMarket()

    const [result] = resolveDefiMarketIconUrls([market], {
      caip2Id: CAIP2_ID,
      tokenInfoByKey: {}
    })

    expect(result?.asset.iconUrl).toBeUndefined()
  })

  it('leaves the market unchanged when caip2Id is not yet known', () => {
    const market = createMockMarket()

    const [result] = resolveDefiMarketIconUrls([market], {
      caip2Id: undefined,
      tokenInfoByKey: {
        [`${CAIP2_ID}-${ADDRESS.toLowerCase()}`]: createMockTokenInfo(
          'https://example.com/logo.png'
        )
      }
    })

    expect(result?.asset.iconUrl).toBeUndefined()
  })

  it('fills in nativeIconUrl for a native-asset market with no iconUrl yet', () => {
    const market = createMockMarket({
      asset: { ...createMockMarket().asset, contractAddress: undefined }
    })

    const [result] = resolveDefiMarketIconUrls([market], {
      caip2Id: CAIP2_ID,
      tokenInfoByKey: {},
      nativeIconUrl: 'https://example.com/avax.png'
    })

    expect(result?.asset.iconUrl).toBe('https://example.com/avax.png')
  })

  it('does not overwrite an iconUrl a native-asset market already has', () => {
    const market = createMockMarket({
      asset: {
        ...createMockMarket().asset,
        contractAddress: undefined,
        iconUrl: 'https://example.com/already-set.png'
      }
    })

    const [result] = resolveDefiMarketIconUrls([market], {
      caip2Id: CAIP2_ID,
      tokenInfoByKey: {},
      nativeIconUrl: 'https://example.com/avax.png'
    })

    expect(result?.asset.iconUrl).toBe('https://example.com/already-set.png')
  })

  it('handles the lowercase/checksummed address casing contract for EVM lookups', () => {
    const market = createMockMarket({
      asset: {
        ...createMockMarket().asset,
        contractAddress:
          ADDRESS.toUpperCase() as DefiMarket['asset']['contractAddress']
      }
    })

    const [result] = resolveDefiMarketIconUrls([market], {
      caip2Id: CAIP2_ID.toUpperCase(),
      tokenInfoByKey: {
        [`${CAIP2_ID}-${ADDRESS.toLowerCase()}`]: createMockTokenInfo(
          'https://example.com/logo.png'
        )
      }
    })

    expect(result?.asset.iconUrl).toBe('https://example.com/logo.png')
  })
})
