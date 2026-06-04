import { DEFAULT_ENTRY_PRICE, DEFAULT_MAX_LEVERAGE } from '../utils/economics'
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
    expect(props.side).toBe('short')
    expect(props.entryPrice).toBe(1973.1)
    expect(props.maxLeverage).toBe(25)
    expect(props.initialLeverage).toBeUndefined()
    expect(props.initialAmount).toBeUndefined()
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
    expect(props.initialAmount).toBe((3 * 100) / 2) // size × entry / leverage
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
    expect(props.entryPrice).toBe(DEFAULT_ENTRY_PRICE) // negative → fallback
    expect(props.maxLeverage).toBe(1) // clamped to >= 1
    expect(props.initialLeverage).toBe(1) // clamped into [1, maxLeverage]
    expect(props.initialAmount).toBe(0) // negative size floored
  })

  it('defaults when params are absent', () => {
    const props = resolveSeededPlaceOrderProps({})
    expect(props.coin).toBe('NVDA')
    expect(props.side).toBe('long')
    expect(props.entryPrice).toBe(DEFAULT_ENTRY_PRICE)
    expect(props.maxLeverage).toBe(DEFAULT_MAX_LEVERAGE)
  })
})
