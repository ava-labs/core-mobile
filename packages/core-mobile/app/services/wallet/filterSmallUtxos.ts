import { Utxo } from '@avalabs/avalanchejs'

/**
 * Minimum UTXO value kept when "Filter out small UTXOs" is enabled
 * (CP-13903). 0.002 AVAX in nAVAX (9 decimals). Matches core-web's
 * SMALL_UTXO_THRESHOLD_NAVAX and core-extension's DUST_THRESHOLD
 * (getMaxUtxos.ts) exactly — keep in lockstep if either ever changes.
 */
export const SMALL_UTXO_THRESHOLD_NAVAX = 2_000_000n

/**
 * Drops AVAX UTXOs strictly below SMALL_UTXO_THRESHOLD_NAVAX.
 *
 * Non-AVAX UTXOs always pass: other assets have their own denominations,
 * so comparing their raw amounts against an AVAX threshold is meaningless.
 * Outputs without an amount() (non-transfer outputs) also pass — only
 * plain value UTXOs are ever considered dust.
 */
export const filterOutSmallUtxos = (
  utxos: Utxo[],
  avaxAssetId: string
): Utxo[] =>
  utxos.filter(utxo => {
    if (utxo.getAssetId() !== avaxAssetId) return true
    const output = utxo.output as unknown as { amount?: () => bigint }
    if (typeof output.amount !== 'function') return true
    return output.amount() >= SMALL_UTXO_THRESHOLD_NAVAX
  })
