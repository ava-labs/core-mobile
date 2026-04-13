import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance'
import { tokenMatchesSearch } from './tokenMatchesSearch'

jest.mock('common/utils/isAddressLikeSearch', () => ({
  isAddressLikeSearch: (_text: string) =>
    _text.trim().startsWith('0x') && _text.trim().length === 42
}))

const makeToken = (
  overrides: Partial<LocalTokenWithBalance> = {}
): LocalTokenWithBalance =>
  ({
    type: TokenType.ERC20,
    symbol: 'USDC',
    name: 'USD Coin',
    localId: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    networkChainId: 43114,
    balance: 0n,
    balanceDisplayValue: '0',
    balanceInCurrency: 0,
    priceInCurrency: 0,
    decimals: 6,
    isDataAccurate: true,
    reputation: null,
    ...overrides
  } as LocalTokenWithBalance)

describe('tokenMatchesSearch', () => {
  describe('empty search', () => {
    it('returns true for empty string', () => {
      expect(tokenMatchesSearch(makeToken(), '', false)).toBe(true)
    })

    it('returns true for whitespace-only string', () => {
      expect(tokenMatchesSearch(makeToken(), '   ', false)).toBe(true)
    })
  })

  describe('name / symbol search', () => {
    it('matches by symbol (case-insensitive)', () => {
      expect(tokenMatchesSearch(makeToken(), 'usdc', false)).toBe(true)
      expect(tokenMatchesSearch(makeToken(), 'USDC', false)).toBe(true)
      expect(tokenMatchesSearch(makeToken(), 'usd', false)).toBe(true)
    })

    it('matches by name (case-insensitive)', () => {
      expect(tokenMatchesSearch(makeToken(), 'usd coin', false)).toBe(true)
      expect(tokenMatchesSearch(makeToken(), 'USD COIN', false)).toBe(true)
      expect(tokenMatchesSearch(makeToken(), 'coin', false)).toBe(true)
    })

    it('does not match unrelated text', () => {
      expect(tokenMatchesSearch(makeToken(), 'bitcoin', false)).toBe(false)
    })
  })

  describe('address search', () => {
    const address = '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e'
    const token = makeToken({ localId: address })

    it('matches by localId when search looks like an address', () => {
      expect(tokenMatchesSearch(token, address, false)).toBe(true)
    })

    it('matches address case-insensitively', () => {
      expect(
        tokenMatchesSearch(
          token,
          '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
          false
        )
      ).toBe(true)
    })

    it('does not match when address does not correspond to this token', () => {
      expect(
        tokenMatchesSearch(
          token,
          '0x1234567890abcdef1234567890abcdef12345678',
          false
        )
      ).toBe(false)
    })

    it('does not use name/symbol matching for address-like searches', () => {
      // token whose name contains an address-looking string but localId doesn't match
      const other = makeToken({
        name: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e Token',
        localId: '0x0000000000000000000000000000000000000000'
      })
      expect(tokenMatchesSearch(other, address, false)).toBe(false)
    })
  })
})
