import { getCurrencySymbol } from './helpers'

const format = (currency: string, amount: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)

describe('getCurrencySymbol', () => {
  it('extracts a single-character symbol', () => {
    expect(getCurrencySymbol('$100.00')).toBe('$')
  })

  it('extracts a multi-character symbol (BRL)', () => {
    expect(getCurrencySymbol('R$100.00')).toBe('R$')
  })

  it('extracts a multi-character symbol with a thousands separator (CAD)', () => {
    expect(getCurrencySymbol('CA$1,234.56')).toBe('CA$')
  })

  it('extracts a letter-only symbol followed by a regular space (CHF)', () => {
    expect(getCurrencySymbol('CHF 100.00')).toBe('CHF')
  })

  it('extracts a letter-only symbol followed by a non-breaking space (CHF)', () => {
    expect(getCurrencySymbol('CHF 100.00')).toBe('CHF')
  })

  it('returns an empty string when the amount has no leading symbol', () => {
    expect(getCurrencySymbol('100.00')).toBe('')
  })

  it('extracts a unicode currency symbol (EUR)', () => {
    expect(getCurrencySymbol('€50.00')).toBe('€')
  })

  it('strips a leading minus sign from a negative amount', () => {
    expect(getCurrencySymbol('-$10.00')).toBe('$')
  })

  it('strips a leading minus sign from a negative multi-character symbol', () => {
    expect(getCurrencySymbol('-R$10.00')).toBe('R$')
  })

  it('strips the showLessThanThreshold "<" prefix', () => {
    expect(getCurrencySymbol('<$0.001')).toBe('$')
  })

  it('extracts the real Intl.NumberFormat output for USD', () => {
    expect(getCurrencySymbol(format('USD', 100))).toBe('$')
  })

  it('extracts the real Intl.NumberFormat output for BRL', () => {
    expect(getCurrencySymbol(format('BRL', 100))).toBe('R$')
  })

  it('extracts the real Intl.NumberFormat output for CAD', () => {
    expect(getCurrencySymbol(format('CAD', 1234.56))).toBe('CA$')
  })

  it('extracts the real Intl.NumberFormat output for CHF', () => {
    expect(getCurrencySymbol(format('CHF', 100))).toBe('CHF')
  })

  it('extracts the real Intl.NumberFormat output for EUR', () => {
    expect(getCurrencySymbol(format('EUR', 50))).toBe('€')
  })
})
