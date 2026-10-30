export const MeldNetworkPartnerPath = {
  PARTNERS: 'network-partner/partners',
  CURRENCIES: 'network-partner/supported/currencies',
  COUNTRIES: 'network-partner/supported/countries',
  DEFAULTS: 'network-partner/defaults',
  PAYMENT_METHODS: 'network-partner/supported/payment-methods',
  ROUTES: 'network-partner/supported/routes'
} as const

export const MeldNetworkPartnerParam = {
  TYPE: 'type',
  CATEGORY: 'category',
  COUNTRY: 'country',
  PARTNER: 'partner',
  STATUS: 'status',
  CURRENCY_CODE: 'currencyCode',
  SUBDIVISION: 'subdivision'
} as const
