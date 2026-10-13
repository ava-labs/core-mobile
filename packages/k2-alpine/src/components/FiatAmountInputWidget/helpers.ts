// Intl.NumberFormat('en-US', { style: 'currency', ... }) always renders the
// symbol as a leading prefix (sometimes followed by a non-breaking space),
// so capture everything up to the first digit instead of matching a single
// currency-symbol character — multi-character prefixes like 'R$', 'CA$',
// 'NT$', 'HK$', 'A$' and 'CHF' need the whole prefix, not just one char.
//
// Empty string when the input starts with a digit — needed so callers that
// format amounts with a token name (e.g. `"1.50 USDC"`) don't render a
// spurious leading symbol.
//
// "-", "<" and "(" are non-digit but not part of the symbol — they come
// from callers' own formatting conventions (negative sign, FormatCurrency's
// showLessThanThreshold prefix, accounting-style negatives), so strip them
// before matching.
export function getCurrencySymbol(amountWithSymbol: string): string {
  const withoutLeadingNoise = amountWithSymbol.replace(/^[\s<(-]+/, '')
  return (withoutLeadingNoise.match(/^\D+/)?.[0] ?? '').trimEnd()
}
