import { renderHook } from '@testing-library/react-hooks'
import { TokenType, NetworkContractToken } from '@avalabs/vm-module-types'
import type { CryptoCurrency } from '../types'
import { useMeldContractTokenMap } from './useMeldContractTokenMap'

const C_CHAIN = 43114
const POLYGON = 137
const NATIVE_SENTINEL = '0x0000000000000000000000000000000000000000'

const mockState = {
  customTokens: {} as { [chainId: string]: NetworkContractToken[] },
  cChainNetwork: undefined as { chainId: number } | undefined,
  lookupData: {} as { [key: string]: unknown }
}

const mockLookupSpy = jest.fn()

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector()
}))

jest.mock('store/customToken', () => ({
  selectAllCustomTokens: () => mockState.customTokens
}))

jest.mock('hooks/earn/useCChainNetwork', () => ({
  __esModule: true,
  default: () => mockState.cChainNetwork
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
    mockState.customTokens = {}
    mockState.cChainNetwork = { chainId: C_CHAIN }
    mockState.lookupData = {}
  })

  describe('which currencies get looked up', () => {
    it('looks up currencies on the C-Chain', () => {
      render([
        currency({ chainId: C_CHAIN.toString(), contractAddress: '0xA1' })
      ])

      expect(requestedAddresses()).toEqual(['0xA1'])
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

    it('skips chains other than the C-Chain', () => {
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
    it('merges custom tokens for the C-Chain', () => {
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

    it('ignores custom tokens on other chains', () => {
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
    it('requests nothing when the C-Chain network is unresolved', () => {
      mockState.cChainNetwork = undefined

      render([currency({ contractAddress: '0xH8' })])

      expect(requestedAddresses()).toEqual([])
    })
  })
})
