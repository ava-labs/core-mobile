export const currencies = [
  { name: 'United States Dollar', symbol: 'USD' },
  { name: 'Euro', symbol: 'EUR' },
  { name: 'Australian Dollar', symbol: 'AUD' },
  { name: 'Canadian Dollar', symbol: 'CAD' },
  { name: 'Swiss Franc', symbol: 'CHF' },
  { name: 'Chilean Peso', symbol: 'CLP' },
  { name: 'Czech Koruna', symbol: 'CZK' },
  { name: 'Danish Krone', symbol: 'DKK' },
  { name: 'British Pound Sterling', symbol: 'GBP' },
  { name: 'Hong Kong Dollar', symbol: 'HKD' },
  { name: 'Hungarian Forint', symbol: 'HUF' }
]

export const DEFAULT_CURRENCY = 'USD'

export const initialState = {
  selected: DEFAULT_CURRENCY
}

export type CurrencyState = {
  selected: string
}
