export const currencies = [
  { name: 'United States Dollar', symbol: 'USD' },
  { name: 'Euro', symbol: 'EUR' },
  { name: 'Australian Dollar', symbol: 'AUD' },
  { name: 'Canadian Dollar', symbol: 'CAD' },
  { name: 'Swiss Franc', symbol: 'CHF' },
  { name: 'Chilean Peso', symbol: 'CLP' },
  { name: 'Chech Koruna', symbol: 'CZK' },
  { name: 'Danish Krone', symbol: 'DKK' },
  { name: 'British Pound Sterling', symbol: 'GBP' },
  { name: 'Hong Kong Dollar', symbol: 'HKD' },
  { name: 'Hungarian Forint', symbol: 'HUF' },
  { name: 'Israeli New Shekel', symbol: 'ILS' },
  { name: 'Indian Rupee', symbol: 'INR' }
]

export const currencyInitialState = {
  currencies,
  selected: 'USD'
}

export type SettingsState = {
  currency: {
    currencies: { name: string; symbol: string }[]
    selected: string
  }
}
