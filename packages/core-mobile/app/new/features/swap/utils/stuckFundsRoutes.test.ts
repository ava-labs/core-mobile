import { AvalancheCaip2ChainId } from '@avalabs/core-chains-sdk'
import type { utils } from '@avalabs/avalanchejs'
import type { Avalanche } from '@avalabs/core-wallets-sdk'
import {
  aliasToCaip2,
  mapAtomicUtxosToRoutes,
  routeLabel,
  type AtomicUtxosByRoute
} from './stuckFundsRoutes'

const AVAX = 'avax-asset-id'

// Minimal UtxoSet stub: one entry per (assetId, amount) pair.
const utxoSet = (
  entries: { assetId: string; amount: bigint }[]
): utils.UtxoSet =>
  ({
    getUTXOs: () =>
      entries.map(e => ({
        getAssetId: () => e.assetId,
        output: { amount: () => e.amount }
      }))
  } as unknown as utils.UtxoSet)

const route = (
  source: Avalanche.ChainIDAlias,
  dest: Avalanche.ChainIDAlias,
  entries: { assetId: string; amount: bigint }[]
): AtomicUtxosByRoute => ({ source, dest, utxos: utxoSet(entries) })

describe('stuckFundsRoutes', () => {
  describe('routeLabel', () => {
    it('formats a route as "<source>-Chain to <dest>-Chain"', () => {
      expect(routeLabel('C', 'P')).toBe('C-Chain to P-Chain')
      expect(routeLabel('X', 'C')).toBe('X-Chain to C-Chain')
      expect(routeLabel('P', 'X')).toBe('P-Chain to X-Chain')
    })
  })

  describe('aliasToCaip2', () => {
    it('maps aliases to mainnet CAIP-2 ids', () => {
      expect(aliasToCaip2('P', false)).toBe(AvalancheCaip2ChainId.P)
      expect(aliasToCaip2('X', false)).toBe(AvalancheCaip2ChainId.X)
      expect(aliasToCaip2('C', false)).toBe(AvalancheCaip2ChainId.C)
    })

    it('maps aliases to testnet CAIP-2 ids', () => {
      expect(aliasToCaip2('P', true)).toBe(AvalancheCaip2ChainId.P_TESTNET)
      expect(aliasToCaip2('X', true)).toBe(AvalancheCaip2ChainId.X_TESTNET)
      expect(aliasToCaip2('C', true)).toBe(AvalancheCaip2ChainId.C_TESTNET)
    })
  })

  describe('mapAtomicUtxosToRoutes', () => {
    it('sums AVAX per route and drops empty routes', () => {
      const raw: AtomicUtxosByRoute[] = [
        route('C', 'P', [
          { assetId: AVAX, amount: 60_000_000n },
          { assetId: AVAX, amount: 40_000_000n }
        ]),
        route('X', 'P', []),
        route('P', 'C', [{ assetId: AVAX, amount: 100_000_000n }]),
        route('X', 'C', []),
        route('P', 'X', []),
        route('C', 'X', [])
      ]

      const result = mapAtomicUtxosToRoutes(raw, AVAX)

      expect(result).toStrictEqual([
        { source: 'C', dest: 'P', amountNAvax: 100_000_000n },
        { source: 'P', dest: 'C', amountNAvax: 100_000_000n }
      ])
    })

    it('ignores non-AVAX assets', () => {
      const raw: AtomicUtxosByRoute[] = [
        route('C', 'P', [
          { assetId: 'some-erc20', amount: 999n },
          { assetId: AVAX, amount: 5n }
        ])
      ]

      expect(mapAtomicUtxosToRoutes(raw, AVAX)).toStrictEqual([
        { source: 'C', dest: 'P', amountNAvax: 5n }
      ])
    })
  })
})
