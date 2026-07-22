// Stub the clearinghouse hook so importing the module under test doesn't pull
// in PerpsProvider -> store/account -> the wallet/ModuleManager stack (which
// can't load under Jest). This suite only exercises the pure resolver.
jest.mock('./usePerpsClearinghouse', () => ({
  usePerpsClearinghouse: () => ({ withdrawableUsd: undefined })
}))

import { resolveSeededPlaceOrderProps } from './useSeededPlaceOrderProps'

describe('resolveSeededPlaceOrderProps', () => {
  it('seeds the open flow from price + maxLeverage', () => {
    const props = resolveSeededPlaceOrderProps({
      coin: 'eth',
      side: 'short',
      price: '1973.1',
      maxLeverage: '25'
    })
    expect(props.coin).toBe('ETH')
    expect(props.initialSide).toBe('short')
    expect(props.entryPrice).toBe(1973.1)
    expect(props.maxLeverage).toBe(25)
    // No leverage param → 0 until the live HL leverage is applied by the hook.
    expect(props.initialLeverage).toBe(0)
    expect(props.initialAmount).toBe(0)
  })

  it('preserves HIP-3 dex case and only upper-cases the ticker', () => {
    const props = resolveSeededPlaceOrderProps({
      coin: 'xyz%3Acl',
      side: 'long',
      price: '100'
    })
    expect(props.coin).toBe('xyz:CL')
  })

  it('seeds the manage flow from entry/leverage/size/tp/sl', () => {
    const props = resolveSeededPlaceOrderProps({
      coin: 'NVDA',
      side: 'long',
      entry: '100',
      leverage: '2',
      size: '3',
      tp: '120',
      sl: '90'
    })
    expect(props.entryPrice).toBe(100)
    expect(props.initialLeverage).toBe(2)
    expect(props.initialAmount).toBe(3 * 100) // size × entry = position notional
    expect(props.initialTakeProfitPrice).toBe(120)
    expect(props.initialStopLossPrice).toBe(90)
  })

  it('clamps malformed deep-link values', () => {
    const props = resolveSeededPlaceOrderProps({
      price: '-5',
      maxLeverage: '0',
      leverage: '999',
      size: '-3'
    })
    // No fabricated fallback: an invalid price resolves to 0 (the hook fills it
    // in from the live mark price).
    expect(props.entryPrice).toBe(0)
    expect(props.maxLeverage).toBe(0) // filled from the market universe by the hook
    // With no known cap yet, only the lower bound (>= 1) is enforced.
    expect(props.initialLeverage).toBe(999)
    // Undefined without a valid entry price to derive collateral from.
    expect(props.initialAmount).toBeUndefined()
  })

  it('ignores non-finite numeric params (Infinity/NaN)', () => {
    const props = resolveSeededPlaceOrderProps({
      price: 'Infinity',
      entry: 'NaN',
      maxLeverage: 'Infinity',
      leverage: 'NaN',
      size: 'Infinity'
    })
    expect(props.entryPrice).toBe(0)
    expect(props.maxLeverage).toBe(0)
    expect(props.initialLeverage).toBe(0)
    expect(props.initialAmount).toBeUndefined()
  })

  it('ignores non-numeric string params', () => {
    const props = resolveSeededPlaceOrderProps({
      price: 'abc',
      maxLeverage: 'abc',
      leverage: 'abc',
      size: 'abc'
    })
    expect(props.entryPrice).toBe(0)
    expect(props.maxLeverage).toBe(0)
    expect(props.initialLeverage).toBe(0)
    expect(props.initialAmount).toBeUndefined()
  })

  it("treats the literal string 'undefined' tp/sl as absent", () => {
    // usePositionActions interpolates `tp=${position.takeProfit}` directly, so
    // an unset trigger serializes to the string "undefined" in the deep link.
    const props = resolveSeededPlaceOrderProps({
      entry: '100',
      leverage: '2',
      size: '3',
      tp: 'undefined',
      sl: 'undefined'
    })
    expect(props.initialTakeProfitPrice).toBeUndefined()
    expect(props.initialStopLossPrice).toBeUndefined()
  })

  it('defaults when params are absent', () => {
    const props = resolveSeededPlaceOrderProps({})
    expect(props.coin).toBe('AVAX')
    expect(props.initialSide).toBe('long')
    // No fabricated price/leverage: the hook fills these from live market data.
    expect(props.entryPrice).toBe(0)
    expect(props.maxLeverage).toBe(0)
  })
})
