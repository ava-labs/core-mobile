/**
 * Converts USD amount to token amount with safety buffer
 * @param params.usdAmount - Amount in USD (with usdDecimals precision)
 * @param params.tokenPriceUSD - Token price in USD (with priceDecimals precision)
 * @param params.tokenDecimals - Decimals of the target token
 * @param params.usdDecimals - Decimals of the USD amount
 * @param params.priceDecimals - Decimals of the price
 * @param params.safetyBufferPercent - Safety buffer percentage (0-100), default 1 (99% of max)
 */
export function convertUsdToTokenAmount(params: {
  usdAmount: bigint
  tokenPriceUSD: bigint
  tokenDecimals: number
  usdDecimals: number
  priceDecimals: number
  safetyBufferPercent?: number
}): bigint {
  const {
    usdAmount,
    tokenPriceUSD,
    tokenDecimals,
    usdDecimals,
    priceDecimals,
    safetyBufferPercent = 1 // Default 1% buffer (99% of max)
  } = params

  if (tokenPriceUSD === 0n) return 0n

  // Clamp safetyBufferPercent to valid range [0, 100]
  const clampedBuffer = Math.max(0, Math.min(100, safetyBufferPercent))

  // Apply safety buffer to account for price fluctuations and rounding
  // This matches AAVE's approach of not allowing exact max borrows
  const bufferMultiplier = 100 - clampedBuffer
  const adjustedUsdAmount = (usdAmount * BigInt(bufferMultiplier)) / 100n

  // tokenAmount = usdAmount * 10^tokenDecimals * 10^priceDecimals / (tokenPriceUSD * 10^usdDecimals)
  // Simplified: tokenAmount = usdAmount * 10^(tokenDecimals + priceDecimals - usdDecimals) / tokenPriceUSD
  const scaleFactor = tokenDecimals + priceDecimals - usdDecimals
  if (scaleFactor >= 0) {
    return (adjustedUsdAmount * 10n ** BigInt(scaleFactor)) / tokenPriceUSD
  } else {
    return adjustedUsdAmount / (tokenPriceUSD * 10n ** BigInt(-scaleFactor))
  }
}
