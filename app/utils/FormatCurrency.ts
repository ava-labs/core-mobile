/**
 * formatCurrency formats the currency to return:
 *   <symbol><amount>
 *   e.g. $10.00, €10.00
 * If <symbol> matches the currency code (e.g. "CHF 10") then it returns:
 *   <amount> <symbol>
 *   e.g. 10 CHF
 */
export function formatCurrency(
  amount: number,
  bigNumberFormatter: Intl.NumberFormat,
  smallNumberFormatter: Intl.NumberFormat,
  currency: string
) {
  const formatter = amount < 1 ? smallNumberFormatter : bigNumberFormatter
  const parts = formatter.formatToParts(amount)
  // match "CHF 10"
  if (parts[0]?.value === currency) {
    const flatArray = parts.map(x => x.value)
    flatArray.push(` ${flatArray.shift() || ''}`)
    return flatArray.join('').trim()
  }
  // match "-CHF 10"
  if (parts[1]?.value === currency) {
    const flatArray = parts.map(x => x.value)
    // remove the currency code after the sign
    flatArray.splice(1, 1)
    flatArray.push(` ${currency}`)
    return flatArray.join('').trim()
  }

  return formatter.format(amount)
}

export function getCurrencyNumberFormat(currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol', // the extension uses 'narrowSymbol'
    maximumFractionDigits: 2, // must be set for the `formatToParts` call below
    minimumFractionDigits: 2
  })
}

export function getSmallNumberCurrencyNumberFormat(currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol', // the extension uses 'narrowSymbol'
    minimumFractionDigits: 2,
    maximumFractionDigits: 8 // must be set for the `formatToParts` call below
  })
}
