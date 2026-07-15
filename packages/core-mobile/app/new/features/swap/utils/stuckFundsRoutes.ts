import type { utils } from '@avalabs/avalanchejs'
import type { Avalanche } from '@avalabs/core-wallets-sdk'
import { getAvalancheChainAliasCaip2 } from 'utils/caip2ChainIds'

/**
 * A single stranded cross-chain transfer route: AVAX exported from `source`
 * sitting in `dest`'s atomic memory, waiting to be imported.
 */
export type StuckRoute = {
  source: Avalanche.ChainIDAlias
  dest: Avalanche.ChainIDAlias
  amountNAvax: bigint
}

/** Raw per-route atomic UTXO set, as returned by `getAllAtomicUTXOs`. */
export type AtomicUtxosByRoute = {
  dest: Avalanche.ChainIDAlias
  source: Avalanche.ChainIDAlias
  utxos: utils.UtxoSet
}

/** Sum the AVAX (nAVAX) held by a UTXO set, ignoring non-AVAX assets. */
const sumAvaxNAvax = (utxos: utils.UtxoSet, avaxAssetId: string): bigint =>
  utxos.getUTXOs().reduce((acc, utxo) => {
    if (utxo.getAssetId() !== avaxAssetId) return acc
    const output = utxo.output as unknown as { amount?: () => bigint }
    return typeof output.amount === 'function' ? acc + output.amount() : acc
  }, 0n)

/**
 * Map raw per-route atomic UTXO sets to stranded routes, dropping any route
 * with no importable AVAX.
 */
export const mapAtomicUtxosToRoutes = (
  raw: AtomicUtxosByRoute[],
  avaxAssetId: string
): StuckRoute[] =>
  raw
    .map(r => ({
      source: r.source,
      dest: r.dest,
      amountNAvax: sumAvaxNAvax(r.utxos, avaxAssetId)
    }))
    .filter(r => r.amountNAvax > 0n)

const CHAIN_NAME: Record<Avalanche.ChainIDAlias, string> = {
  C: 'C-Chain',
  P: 'P-Chain',
  X: 'X-Chain'
}

/** Human label for a route, e.g. `C-Chain to P-Chain`. */
export const routeLabel = (
  source: Avalanche.ChainIDAlias,
  dest: Avalanche.ChainIDAlias
): string => `${CHAIN_NAME[source]} to ${CHAIN_NAME[dest]}`

/** CAIP-2 id for an Avalanche chain alias, network-aware. */
export const aliasToCaip2 = (
  alias: Avalanche.ChainIDAlias,
  isTestnet: boolean
): string => getAvalancheChainAliasCaip2(alias, isTestnet)
