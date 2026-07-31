import {
  providerCryptoCode,
  ServiceProviders,
  MELD_CURRENCY_CODES
} from './consts'

describe('providerCryptoCode', () => {
  it('maps C-Chain Avalanche codes to the Swapped/Mercuryo variants', () => {
    expect(
      providerCryptoCode(MELD_CURRENCY_CODES.AVAXC, ServiceProviders.SWAPPED)
    ).toBe('AVAX')
    expect(
      providerCryptoCode(MELD_CURRENCY_CODES.AVAXC, ServiceProviders.MERCURYO)
    ).toBe('AVAX')
    expect(
      providerCryptoCode(
        MELD_CURRENCY_CODES.USDC_AVAXC,
        ServiceProviders.SWAPPED
      )
    ).toBe('USDC_AVAX')
  })

  it('leaves the code unchanged for providers without an override', () => {
    expect(
      providerCryptoCode(MELD_CURRENCY_CODES.AVAXC, ServiceProviders.TRANSAK)
    ).toBe('AVAXC')
  })

  it('leaves codes without an override unchanged', () => {
    expect(
      providerCryptoCode(MELD_CURRENCY_CODES.BTC, ServiceProviders.SWAPPED)
    ).toBe('BTC')
  })

  it('returns the code unchanged when provider or code is missing', () => {
    expect(providerCryptoCode(MELD_CURRENCY_CODES.AVAXC, undefined)).toBe(
      'AVAXC'
    )
    expect(providerCryptoCode(undefined, ServiceProviders.SWAPPED)).toBe(
      undefined
    )
  })
})
