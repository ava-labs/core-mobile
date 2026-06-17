/**
 * Avalanche cross-chain transfers enforce 9-decimal nAVAX precision on the
 * source amount (1 AVAX = 1e9 nAVAX). For 18-decimal C-Chain native AVAX
 * inputs we floor the trailing 9 wei digits so the wei amount converts
 * cleanly to a whole number of nAVAX.
 *
 * Mirrors the staking flow's `toFixed(9)` clamp: silent at the input layer,
 * no error to the user. What they see is what gets sent.
 *
 * - 18-decimal source (C-Chain): `amount` floored to the nearest 1e9.
 * - 9-decimal or fewer source (P/X-Chain): returned unchanged.
 */
export const clampToNAvax = (amount: bigint, decimals: number): bigint => {
  if (decimals <= 9) return amount
  const scale = 10n ** BigInt(decimals - 9)
  return (amount / scale) * scale
}
