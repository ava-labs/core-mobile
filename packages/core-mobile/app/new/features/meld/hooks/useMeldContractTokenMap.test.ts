import { renderHook } from '@testing-library/react-hooks'
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenType, NetworkContractToken } from '@avalabs/vm-module-types'
import { tokenAddresses } from 'consts/tokenIds'
import type { CryptoCurrency } from '../types'
import { useMeldContractTokenMap } from './useMeldContractTokenMap'

const C_CHAIN = 43114
const ETHEREUM = 1
const POLYGON = 137
const SOLANA = ChainId.SOLANA_MAINNET_ID
const MELD_SOLANA_CHAIN_ID = '101'
const NATIVE_SENTINEL = '0x0000000000000000000000000000000000000000'

const mockState = {
  isSolanaSupportBlocked: false,
  isDeveloperMode: false,
  customTokens: {} as { [chainId: string]: NetworkContractToken[] },
  cChainNetwork: undefined as { chainId: number } | undefined,
  ethereumNetwork: undefined as { chainId: number } | undefined,
  lookupData: {} as { [key: string]: unknown }
}

const mockLookupSpy = jest.fn()

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector()
}))

jest.mock('store/posthog/slice', () => ({
  selectIsSolanaSupportBlocked: () => mockState.isSolanaSupportBlocked
}))

jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: () => mockState.isDeveloperMode
}))

jest.mock('store/customToken', () => ({
  selectAllCustomTokens: () => mockState.customTokens
}))

jest.mock('hooks/networks/useNetworks', () => ({
  useNetworks: () => ({ allNetworks: {} })
}))

jest.mock('hooks/earn/useCChainNetwork', () => ({
  __esModule: true,
  default: () => mockState.cChainNetwork
}))

jest.mock('services/network/utils/providerUtils', () => ({
  getEthereumNetwork: () => mockState.ethereumNetwork
}))

jest.mock('common/hooks/useTokenLookup', () => ({
  useTokenLookup: (tokens: unknown) => {
    mockLookupSpy(tokens)
    return { data: mockState.lookupData, isLoading: false }
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}))

const currency = (overrides: Partial<CryptoCurrency> = {}): CryptoCurrency =>
  ({
    currencyCode: 'TKN',
    name: 'Token',
    chainId: C_CHAIN.toString(),
    contractAddress: '0xAaAa000000000000000000000000000000000001',
    ...overrides
  } as CryptoCurrency)

const entry = (
  caip2Id: string,
  address: string,
  overrides: Record<string, unknown> = {}
): [string, unknown] => [
  `${caip2Id}-${address}`.startsWith('eip155')
    ? `${caip2Id}-${address}`.toLowerCase()
    : `${caip2Id}-${address}`,
  {
    name: 'Token',
    symbol: 'TKN',
    meta: { decimals: { [caip2Id]: 18 }, logoUri: 'https://logo' },
    ...overrides
  }
]

const render = (
  cryptoCurrencies: CryptoCurrency[]
): Map<string, NetworkContractToken> => {
  const { result } = renderHook(() => useMeldContractTokenMap(cryptoCurrencies))
  return result.current
}

const requestedAddresses = (): string[] =>
  (mockLookupSpy.mock.calls[0]?.[0] ?? []).map(
    (token: { address: string }) => token.address
  )

describe('useMeldContractTokenMap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockState.isSolanaSupportBlocked = false
    mockState.isDeveloperMode = false
    mockState.customTokens = {}
    mockState.cChainNetwork = { chainId: C_CHAIN }
    mockState.ethereumNetwork = { chainId: ETHEREUM }
    mockState.lookupData = {}
  })

  describe('which currencies get looked up', () => {
    it('looks up currencies on the scoped chains', () => {
      render([
        currency({ chainId: C_CHAIN.toString(), contractAddress: '0xA1' }),
        currency({ chainId: ETHEREUM.toString(), contractAddress: '0xB2' })
      ])

      expect(requestedAddresses()).toEqual(['0xA1', '0xB2'])
    })

    it('skips currencies with no contract address or chain', () => {
      render([
        currency({ contractAddress: null }),
        currency({ chainId: null }),
        currency({ contractAddress: '0xC3' })
      ])

      expect(requestedAddresses()).toEqual(['0xC3'])
    })

    it('skips the native zero-address sentinel', () => {
      render([
        currency({ contractAddress: NATIVE_SENTINEL }),
        currency({ contractAddress: '0xD4' })
      ])

      expect(requestedAddresses()).toEqual(['0xD4'])
    })

    it('skips chains outside the scoped set', () => {
      render([
        currency({ chainId: POLYGON.toString(), contractAddress: '0xE5' }),
        currency({ chainId: C_CHAIN.toString(), contractAddress: '0xF6' })
      ])

      expect(requestedAddresses()).toEqual(['0xF6'])
    })

    it('requests nothing when there are no currencies', () => {
      render([])

      expect(requestedAddresses()).toEqual([])
    })
  })

  describe('solana', () => {
    it("translates Meld's solana chain id and allows USDC", () => {
      render([
        currency({
          chainId: MELD_SOLANA_CHAIN_ID,
          contractAddress: tokenAddresses.USDC_SOLANA
        })
      ])

      expect(mockLookupSpy.mock.calls[0]?.[0]).toEqual([
        {
          caip2Id: expect.stringContaining('solana:'),
          address: tokenAddresses.USDC_SOLANA
        }
      ])
    })

    it('allows only USDC on solana, matching the catalog it replaced', () => {
      render([
        currency({
          chainId: MELD_SOLANA_CHAIN_ID,
          contractAddress: 'SomeOtherSplMintAddress1111111111111111111'
        })
      ])

      expect(requestedAddresses()).toEqual([])
    })

    it('drops solana entirely when solana support is blocked', () => {
      mockState.isSolanaSupportBlocked = true

      render([
        currency({
          chainId: MELD_SOLANA_CHAIN_ID,
          contractAddress: tokenAddresses.USDC_SOLANA
        })
      ])

      expect(requestedAddresses()).toEqual([])
    })
  })

  describe('mapping lookup results into contract tokens', () => {
    it('builds an ERC20 token carrying its chainId', () => {
      const address = '0xAbCdEf0000000000000000000000000000000001'
      mockState.lookupData = Object.fromEntries([
        entry('eip155:43114', address, {
          symbol: 'JOE',
          name: 'JOE Token',
          meta: { decimals: { 'eip155:43114': 6 }, logoUri: 'https://joe' }
        })
      ])

      const map = render([currency({ contractAddress: address })])
      const token = map.get(`${C_CHAIN}-${address.toLowerCase()}`)

      expect(token).toEqual({
        address,
        chainId: C_CHAIN,
        name: 'JOE Token',
        symbol: 'JOE',
        decimals: 6,
        logoUri: 'https://joe',
        type: TokenType.ERC20
      })
    })

    it('builds an SPL token with its caip2Id and contractType', () => {
      const address = tokenAddresses.USDC_SOLANA
      const caip2Id = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
      mockState.lookupData = {
        [`${caip2Id}-${address}`]: {
          name: 'USD Coin',
          symbol: 'USDC',
          meta: { decimals: { [caip2Id]: 6 }, logoUri: 'https://usdc' }
        }
      }

      const map = render([
        currency({ chainId: MELD_SOLANA_CHAIN_ID, contractAddress: address })
      ])
      const token = map.get(`${SOLANA}-${address.toLowerCase()}`)

      expect(token).toMatchObject({
        address,
        chainId: SOLANA,
        symbol: 'USDC',
        decimals: 6,
        type: TokenType.SPL,
        contractType: TokenType.SPL,
        caip2Id
      })
    })

    it('omits a token whose lookup entry has no decimals for that chain', () => {
      const address = '0xAbCdEf0000000000000000000000000000000002'
      mockState.lookupData = Object.fromEntries([
        entry('eip155:43114', address, { meta: { logoUri: 'https://x' } })
      ])

      const map = render([currency({ contractAddress: address })])

      expect(map.size).toBe(0)
    })

    it('omits a token the lookup did not return', () => {
      const map = render([
        currency({
          contractAddress: '0xAbCdEf0000000000000000000000000000000003'
        })
      ])

      expect(map.size).toBe(0)
    })

    it('keys the map with a lowercased address', () => {
      const address = '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333'
      mockState.lookupData = Object.fromEntries([
        entry('eip155:43114', address)
      ])

      const map = render([currency({ contractAddress: address })])

      expect([...map.keys()]).toEqual([`${C_CHAIN}-${address.toLowerCase()}`])
    })
  })

  describe('custom tokens', () => {
    it('merges custom tokens for the scoped chains', () => {
      const custom = {
        address: '0xCustom1',
        name: 'Custom',
        symbol: 'CUS',
        decimals: 18,
        type: TokenType.ERC20
      } as NetworkContractToken

      mockState.customTokens = { [C_CHAIN]: [custom] }

      const map = render([])

      expect(map.get(`${C_CHAIN}-0xcustom1`)).toBe(custom)
    })

    it('ignores custom tokens on unscoped chains', () => {
      mockState.customTokens = {
        [POLYGON]: [
          {
            address: '0xCustom2',
            name: 'Custom',
            symbol: 'CUS',
            decimals: 18,
            type: TokenType.ERC20
          } as NetworkContractToken
        ]
      }

      const map = render([])

      expect(map.size).toBe(0)
    })
  })

  describe('missing networks', () => {
    it('scopes to whatever networks resolved', () => {
      mockState.ethereumNetwork = undefined

      render([
        currency({ chainId: ETHEREUM.toString(), contractAddress: '0xG7' }),
        currency({ chainId: C_CHAIN.toString(), contractAddress: '0xH8' })
      ])

      expect(requestedAddresses()).toEqual(['0xH8'])
    })
  })
})
