export const npPartners = [
  {
    serviceProvider: 'MERCURYO',
    name: 'Mercuryo',
    status: 'LIVE',
    categories: ['CRYPTO_ONRAMP'],
    capabilities: [
      {
        category: 'CRYPTO_ONRAMP',
        domains: ['PAYMENT'],
        status: 'LIVE'
      }
    ],
    url: 'https://mercuryo.io',
    lastLoadedAt: '2026-10-27T10:15:35.540492Z',
    logo: {
      dark: 'https://cdn.meld.io/images-serviceprovider/MERCURYO/logo_dark.png',
      light:
        'https://cdn.meld.io/images-serviceprovider/MERCURYO/logo_light.png',
      darkShort:
        'https://cdn.meld.io/images-serviceprovider/MERCURYO/short_logo_dark.png',
      lightShort:
        'https://cdn.meld.io/images-serviceprovider/MERCURYO/short_logo_light.png'
    },
    headless: {
      supported: true,
      uiCustomization: false
    },
    checkout: true,
    kycMode: 'SYNC',
    kycShareMethods: ['TOKEN'],
    isExchange: false
  },
  {
    serviceProvider: 'STRIPE',
    name: 'Stripe',
    status: 'LIVE',
    categories: ['CRYPTO_ONRAMP'],
    capabilities: [
      {
        category: 'CRYPTO_ONRAMP',
        domains: ['PAYMENT'],
        status: 'LIVE'
      }
    ],
    url: 'https://stripe.com',
    lastLoadedAt: '2026-10-14T14:10:58.022637Z',
    logo: {
      dark: 'https://cdn.meld.io/images-serviceprovider/STRIPE/logo_dark.png',
      light: 'https://cdn.meld.io/images-serviceprovider/STRIPE/logo_light.png',
      darkShort:
        'https://cdn.meld.io/images-serviceprovider/STRIPE/short_logo_dark.png',
      lightShort:
        'https://cdn.meld.io/images-serviceprovider/STRIPE/short_logo_light.png'
    },
    headless: {
      supported: true,
      uiCustomization: false
    },
    checkout: true,
    kycMode: 'PROVIDER_MANAGED',
    kycShareMethods: [],
    isExchange: false
  },
  {
    serviceProvider: 'SWAPPED',
    name: 'Swapped',
    status: 'LIVE',
    categories: ['CRYPTO_ONRAMP'],
    capabilities: [
      {
        category: 'CRYPTO_ONRAMP',
        domains: ['PAYMENT'],
        status: 'LIVE'
      }
    ],
    url: 'https://swapped.com',
    lastLoadedAt: '2026-10-14T14:11:00.623692Z',
    logo: {
      dark: 'https://cdn.meld.io/images-serviceprovider/SWAPPED/logo_dark.png',
      light:
        'https://cdn.meld.io/images-serviceprovider/SWAPPED/logo_light.png',
      darkShort:
        'https://cdn.meld.io/images-serviceprovider/SWAPPED/short_logo_dark.png',
      lightShort:
        'https://cdn.meld.io/images-serviceprovider/SWAPPED/short_logo_light.png'
    },
    headless: {
      supported: false,
      uiCustomization: false
    },
    checkout: true,
    kycMode: 'NONE',
    kycShareMethods: [],
    isExchange: false
  }
]

export const npCryptoCurrencies = [
  {
    currencyCode: 'AVAXC',
    name: 'Avalanche C-Chain',
    decimalPlaces: 18,
    type: 'CRYPTO',
    chainCode: 'AVAXC',
    chainId: '43114',
    contract: '0x0000000000000000000000000000000000000000',
    symbol: 'https://cdn.meld.io/images-currency/crypto/AVAXC/symbol.png'
  },
  {
    currencyCode: 'BTC',
    name: 'Bitcoin',
    decimalPlaces: 18,
    type: 'CRYPTO',
    chainCode: 'BTC',
    chainId: 'bip122:000000000019d6689c085ae165831e93',
    symbol: 'https://cdn.meld.io/images-currency/crypto/BTC/symbol.png'
  },
  {
    currencyCode: 'SOL',
    name: 'Solana',
    decimalPlaces: 18,
    type: 'CRYPTO',
    chainCode: 'SOLANA',
    chainId: '101',
    contract: 'So11111111111111111111111111111111111111111',
    symbol: 'https://cdn.meld.io/images-currency/crypto/SOL/symbol.png'
  },
  {
    currencyCode: 'USDC_AVAXC',
    name: 'USD Coin',
    decimalPlaces: 18,
    type: 'CRYPTO',
    chainCode: 'AVAXC',
    chainId: '43114',
    contract: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    symbol: 'https://cdn.meld.io/images-currency/crypto/USDC_AVAXC/symbol.png'
  }
]

export const npFiatCurrencies = [
  {
    currencyCode: 'AED',
    name: 'UAE Dirham',
    decimalPlaces: 3,
    type: 'FIAT',
    symbol: 'https://cdn.meld.io/images-currency/fiat/AED/symbol.png'
  },
  {
    currencyCode: 'ALL',
    name: 'Lek',
    decimalPlaces: 3,
    type: 'FIAT',
    symbol: 'https://cdn.meld.io/images-currency/fiat/ALL/symbol.png'
  },
  {
    currencyCode: 'USD',
    name: 'US Dollar',
    decimalPlaces: 3,
    type: 'FIAT',
    symbol: 'https://cdn.meld.io/images-currency/fiat/USD/symbol.png'
  }
]

export const npCountries = [
  {
    countryCode: 'AD',
    name: 'Andorra',
    flag: 'https://cdn.meld.io/images-country/AD/flag.svg',
    subdivisions: []
  },
  {
    countryCode: 'DE',
    name: 'Germany',
    flag: 'https://cdn.meld.io/images-country/DE/flag.svg',
    subdivisions: []
  },
  {
    countryCode: 'US',
    name: 'United States',
    flag: 'https://cdn.meld.io/images-country/US/flag.svg',
    subdivisions: []
  }
]

export const npDefaultsUs = {
  countryCode: 'US',
  category: 'CRYPTO_ONRAMP',
  currencyCode: 'USD',
  paymentMethods: ['CREDIT_DEBIT_CARD', 'APPLE_PAY', 'ROBINHOOD_BUYING_POWER']
}

export const npPaymentMethodsUs = [
  {
    countryCode: 'US',
    providerMethod: 'ach',
    method: 'ACH',
    category: 'CRYPTO_ONRAMP',
    name: 'ACH',
    type: 'BANK_TRANSFER',
    logo: {
      dark: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_dark.png',
      light: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_light.png'
    },
    headlessSupported: false,
    checkoutSupported: true
  },
  {
    countryCode: 'US',
    providerMethod: 'apple',
    method: 'APPLE_PAY',
    category: 'CRYPTO_ONRAMP',
    name: 'Apple Pay',
    type: 'MOBILE_WALLET',
    logo: {
      dark: 'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_dark.png',
      light: 'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_light.png'
    },
    headlessSupported: true,
    checkoutSupported: true
  },
  {
    countryCode: 'US',
    providerMethod: 'card',
    method: 'CREDIT_DEBIT_CARD',
    category: 'CRYPTO_ONRAMP',
    name: 'Credit & Debit Card',
    type: 'CARD',
    logo: {
      dark: 'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_dark.png',
      light:
        'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_light.png'
    },
    headlessSupported: true,
    checkoutSupported: true
  }
]

export const npRoutesUsdAvaxc = [
  {
    partner: 'STRIPE',
    source: 'USD',
    destination: 'AVAXC',
    paymentMethods: [
      {
        paymentType: 'CARD',
        name: 'CREDIT_DEBIT_CARD',
        partnerMethodName: 'credit_card',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 10.83,
          max: 16133.0
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_light.png'
        },
        headlessSupported: true,
        checkoutSupported: true,
        cardRenderMode: 'SDK_NATIVE',
        headlessPresentation: {
          surface: 'NATIVE_SDK',
          protocol: 'STRIPE_CRYPTO_ONRAMP',
          version: 1
        },
        headlessProviderMethod: 'credit_card'
      },
      {
        paymentType: 'BANK_TRANSFER',
        name: 'ACH',
        partnerMethodName: 'ach',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 10.83,
          max: 16133.0
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_dark.png',
          light: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_light.png'
        },
        headlessSupported: false,
        checkoutSupported: true
      },
      {
        paymentType: 'MOBILE_WALLET',
        name: 'APPLE_PAY',
        partnerMethodName: 'debit_card',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 10.83,
          max: 16133.0
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_light.png'
        },
        headlessSupported: true,
        checkoutSupported: true,
        headlessPresentation: {
          surface: 'NATIVE_SDK',
          protocol: 'STRIPE_CRYPTO_ONRAMP',
          version: 1
        },
        headlessProviderMethod: 'debit_card'
      }
    ],
    kycLimits: []
  }
]

export const npRoutesUsdBtc = [
  {
    partner: 'MERCURYO',
    source: 'USD',
    destination: 'BTC',
    paymentMethods: [
      {
        paymentType: 'CARD',
        name: 'CREDIT_DEBIT_CARD',
        partnerMethodName: 'card',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 27.93,
          max: 16754.8
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_light.png'
        },
        headlessSupported: true,
        checkoutSupported: true,
        cardRenderMode: 'IFRAME',
        headlessPresentation: {
          surface: 'EMBEDDED_WIDGET',
          protocol: 'MERCURYO_WIDGET',
          version: 1
        },
        headlessProviderMethod: 'card'
      },
      {
        paymentType: 'MOBILE_WALLET',
        name: 'APPLE_PAY',
        partnerMethodName: 'apple',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 27.93,
          max: 16754.8
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_light.png'
        },
        headlessSupported: true,
        checkoutSupported: true,
        headlessPresentation: {
          surface: 'NATIVE_TOKEN',
          protocol: 'MELD_WALLET_TOKEN',
          version: 1
        },
        headlessProviderMethod: 'apple'
      },
      {
        paymentType: 'MOBILE_WALLET',
        name: 'GOOGLE_PAY',
        partnerMethodName: 'google',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 27.93,
          max: 16754.8
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/GOOGLE_PAY/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/GOOGLE_PAY/logo_light.png'
        },
        headlessSupported: false,
        checkoutSupported: true
      }
    ],
    kycLimits: [
      {
        provider: 'MERCURYO',
        category: 'CRYPTO_ONRAMP',
        countryCode: 'US',
        limitType: 'TRANSACTION',
        currencyCode: 'USD',
        level1: 1499.0
      }
    ]
  },
  {
    partner: 'STRIPE',
    source: 'USD',
    destination: 'BTC',
    paymentMethods: [
      {
        paymentType: 'CARD',
        name: 'CREDIT_DEBIT_CARD',
        partnerMethodName: 'credit_card',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 10.83,
          max: 16133.0
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_light.png'
        },
        headlessSupported: true,
        checkoutSupported: true,
        cardRenderMode: 'SDK_NATIVE',
        headlessPresentation: {
          surface: 'NATIVE_SDK',
          protocol: 'STRIPE_CRYPTO_ONRAMP',
          version: 1
        },
        headlessProviderMethod: 'credit_card'
      },
      {
        paymentType: 'BANK_TRANSFER',
        name: 'ACH',
        partnerMethodName: 'ach',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 10.83,
          max: 16133.0
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_dark.png',
          light: 'https://cdn.meld.io/images-paymentmethod/ACH/logo_light.png'
        },
        headlessSupported: false,
        checkoutSupported: true
      },
      {
        paymentType: 'MOBILE_WALLET',
        name: 'APPLE_PAY',
        partnerMethodName: 'debit_card',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 10.83,
          max: 16133.0
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_light.png'
        },
        headlessSupported: true,
        checkoutSupported: true,
        headlessPresentation: {
          surface: 'NATIVE_SDK',
          protocol: 'STRIPE_CRYPTO_ONRAMP',
          version: 1
        },
        headlessProviderMethod: 'debit_card'
      }
    ],
    kycLimits: []
  },
  {
    partner: 'SWAPPED',
    source: 'USD',
    destination: 'BTC',
    paymentMethods: [
      {
        paymentType: 'CARD',
        name: 'CREDIT_DEBIT_CARD',
        partnerMethodName: 'creditcard',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 7.78,
          max: 111185.7
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/CREDIT_DEBIT_CARD/logo_light.png'
        },
        headlessSupported: false,
        checkoutSupported: true
      },
      {
        paymentType: 'MOBILE_WALLET',
        name: 'APPLE_PAY',
        partnerMethodName: 'apple-pay',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 7.78,
          max: 111185.7
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/APPLE_PAY/logo_light.png'
        },
        headlessSupported: false,
        checkoutSupported: true
      },
      {
        paymentType: 'MOBILE_WALLET',
        name: 'GOOGLE_PAY',
        partnerMethodName: 'google-pay',
        category: 'CRYPTO_ONRAMP',
        limits: {
          currencyCode: 'USD',
          min: 7.78,
          max: 111185.7
        },
        logo: {
          dark: 'https://cdn.meld.io/images-paymentmethod/GOOGLE_PAY/logo_dark.png',
          light:
            'https://cdn.meld.io/images-paymentmethod/GOOGLE_PAY/logo_light.png'
        },
        headlessSupported: false,
        checkoutSupported: true
      }
    ],
    kycLimits: []
  }
]
