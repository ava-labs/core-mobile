import { TokenType } from '@avalabs/vm-module-types'
import type { LocalTokenWithBalance } from 'store/balance'
import {
  getSwappableBalance,
  getSwappableBalanceDisplayValue
} from './getSwappableBalance'

describe('getSwappableBalance', () => {
  it('returns balance for a native EVM token (no available field)', () => {
    const token = {
      type: TokenType.NATIVE,
      balance: 5000n
    } as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(5000n)
  })

  it('returns balance for an ERC20 token', () => {
    const token = {
      type: TokenType.ERC20,
      balance: 1234n
    } as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(1234n)
  })

  it('returns available (not balance) for a P-chain token with staked funds', () => {
    // balance includes staked; available is the unlocked/unstaked portion
    const token = {
      type: TokenType.NATIVE,
      balance: 10000n,
      available: 3000n
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(3000n)
  })

  it('returns available for an X-chain token with locked funds', () => {
    const token = {
      type: TokenType.NATIVE,
      balance: 8000n,
      available: 5000n
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(5000n)
  })

  it('returns available of 0n when everything is staked/locked', () => {
    const token = {
      type: TokenType.NATIVE,
      balance: 10000n,
      available: 0n
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(0n)
  })

  it('falls back to balance when available is the key but the value is undefined', () => {
    const token = {
      type: TokenType.NATIVE,
      balance: 7000n,
      available: undefined
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(7000n)
  })

  it('falls back to balance when available is a non-bigint value (e.g. a string)', () => {
    const token = {
      type: TokenType.NATIVE,
      balance: 7000n,
      available: '3000'
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalance(token)).toBe(7000n)
  })
})

describe('getSwappableBalanceDisplayValue', () => {
  it('returns balanceDisplayValue for a token without availableDisplayValue', () => {
    const token = {
      type: TokenType.ERC20,
      balanceDisplayValue: '12.5'
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalanceDisplayValue(token)).toBe('12.5')
  })

  it('returns availableDisplayValue for a P/X-chain token with staked funds', () => {
    const token = {
      type: TokenType.NATIVE,
      balanceDisplayValue: '100',
      availableDisplayValue: '30'
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalanceDisplayValue(token)).toBe('30')
  })

  it('falls back to balanceDisplayValue when availableDisplayValue is not a string', () => {
    const token = {
      type: TokenType.NATIVE,
      balanceDisplayValue: '100',
      availableDisplayValue: undefined
    } as unknown as LocalTokenWithBalance
    expect(getSwappableBalanceDisplayValue(token)).toBe('100')
  })
})
