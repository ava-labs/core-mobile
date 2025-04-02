export enum CurrencySymbol {
  AED = 'AED',
  ARS = 'ARS',
  AUD = 'AUD',
  BDT = 'BDT',
  BGN = 'BGN',
  BRL = 'BRL',
  CAD = 'CAD',
  CHF = 'CHF',
  CLP = 'CLP',
  CNY = 'CNY',
  COP = 'COP',
  CZK = 'CZK',
  DKK = 'DKK',
  EGP = 'EGP',
  EUR = 'EUR',
  GBP = 'GBP',
  HKD = 'HKD',
  HUF = 'HUF',
  IDR = 'IDR',
  ILS = 'ILS',
  INR = 'INR',
  IRR = 'IRR',
  JPY = 'JPY',
  KRW = 'KRW',
  MAD = 'MAD',
  MXN = 'MXN',
  MYR = 'MYR',
  NGN = 'NGN',
  NOK = 'NOK',
  NZD = 'NZD',
  PHP = 'PHP',
  PKR = 'PKR',
  PLN = 'PLN',
  RON = 'RON',
  RUB = 'RUB',
  SAR = 'SAR',
  SEK = 'SEK',
  SGD = 'SGD',
  THB = 'THB',
  TRY = 'TRY',
  TWD = 'TWD',
  USD = 'USD',
  VND = 'VND',
  ZAR = 'ZAR'
}

export type Currency = {
  name: string
  symbol: CurrencySymbol
}

export const currencies: Currency[] = [
  { name: 'United States Dollar', symbol: CurrencySymbol.USD },
  { name: 'Euro', symbol: CurrencySymbol.EUR },
  { name: 'Australian Dollar', symbol: CurrencySymbol.AUD },
  { name: 'Canadian Dollar', symbol: CurrencySymbol.CAD },
  { name: 'Swiss Franc', symbol: CurrencySymbol.CHF },
  { name: 'Chilean Peso', symbol: CurrencySymbol.CLP },
  { name: 'Czech Koruna', symbol: CurrencySymbol.CZK },
  { name: 'Danish Krone', symbol: CurrencySymbol.DKK },
  { name: 'British Pound Sterling', symbol: CurrencySymbol.GBP },
  { name: 'Hong Kong Dollar', symbol: CurrencySymbol.HKD },
  { name: 'Hungarian Forint', symbol: CurrencySymbol.HUF }
]

export const DEFAULT_CURRENCY = CurrencySymbol.USD

export const initialState = {
  selected: DEFAULT_CURRENCY
}

export type CurrencyState = {
  selected: string
}
