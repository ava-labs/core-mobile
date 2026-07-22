import { TokenUnit } from '@avalabs/core-utils-sdk'
import { floorToUsdcUnit, usdcAmountFromTokenUnit } from './usdcAmount'

const usdc = (subUnits: bigint): TokenUnit => new TokenUnit(subUnits, 6, 'USDC')

describe('usdcAmountFromTokenUnit', () => {
  it('keeps full USDC precision instead of display-rounding', () => {
    // toDisplay({asNumber: true}) would round this up to 44.1489.
    expect(usdcAmountFromTokenUnit(usdc(44148877n))).toBe(44.148877)
  })

  it('floors fractional subunits from percentage presets', () => {
    // 25% of 44.148877 = 11.03721925.
    expect(usdcAmountFromTokenUnit(usdc(44148877n).mul(0.25))).toBe(11.037219)
  })
})

describe('floorToUsdcUnit', () => {
  it('floors amounts with more than USDC precision', () => {
    expect(floorToUsdcUnit(44.1488779).toSubUnit()).toBe(44148877n)
  })

  it('is exact on values Math.floor(x * 1e6) misrepresents', () => {
    // 8.2 * 1e6 === 8199999.999999999 and 0.000249 * 1e6 === 248.99999…, so a
    // float multiply under-floors these by one subunit.
    expect(floorToUsdcUnit(8.2).toSubUnit()).toBe(8200000n)
    expect(floorToUsdcUnit(0.000249).toSubUnit()).toBe(249n)
  })
})
