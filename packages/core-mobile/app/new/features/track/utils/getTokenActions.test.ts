import { MarketType } from 'store/watchlist'
import { getTokenActions } from './getTokenActions'

const defaultArgs = {
  isZeroBalance: false,
  isSwapBlocked: false,
  isTokenSwappable: true,
  hasEnoughAvax: false,
  isEarnBlocked: false,
  isAVAX: false,
  marketType: MarketType.TOP
}

it('returns all false for SEARCH marketType', () => {
  const result = getTokenActions({
    ...defaultArgs,
    marketType: MarketType.SEARCH
  })
  expect(result).toEqual({
    showBuy: false,
    showSwap: false,
    showStake: false
  })
})

it('returns buy and swap for non-AVAX token with balance and swappable', () => {
  const result = getTokenActions({
    ...defaultArgs,
    isAVAX: false
  })
  expect(result).toEqual({ showBuy: false, showSwap: true, showStake: false })
})

it('returns only buy for non-AVAX token with zero balance', () => {
  const result = getTokenActions({
    ...defaultArgs,
    isZeroBalance: true,
    isAVAX: false
  })
  expect(result).toEqual({ showBuy: true, showSwap: false, showStake: false })
})

it('returns nothing for non-AVAX token if not swappable', () => {
  const result = getTokenActions({
    ...defaultArgs,
    isTokenSwappable: false,
    isAVAX: false
  })
  expect(result).toEqual({
    showBuy: false,
    showSwap: false,
    showStake: false
  })
})

describe('AVAX token', () => {
  it('returns swap and stake when there is enough balance to stake', () => {
    const result = getTokenActions({
      ...defaultArgs,
      isAVAX: true,
      hasEnoughAvax: true
    })
    expect(result).toEqual({ showBuy: false, showSwap: true, showStake: true })
  })

  it('returns only swap when there is not enough balance to stake', () => {
    const result = getTokenActions({
      ...defaultArgs,
      isAVAX: true,
      hasEnoughAvax: false
    })
    expect(result).toEqual({ showBuy: false, showSwap: true, showStake: false })
  })

  it('returns only buy for AVAX if balance is zero', () => {
    const result = getTokenActions({
      ...defaultArgs,
      isAVAX: true,
      isZeroBalance: true
    })
    expect(result).toEqual({ showBuy: true, showSwap: false, showStake: false })
  })
})

it('returns no actions if all flags are false and not swappable', () => {
  const result = getTokenActions({
    marketType: MarketType.TOP,
    isAVAX: false,
    isZeroBalance: true,
    isSwapBlocked: true,
    isTokenSwappable: false,
    hasEnoughAvax: false,
    isEarnBlocked: true
  })
  expect(result).toEqual({
    showBuy: false,
    showSwap: false,
    showStake: false
  })
})
