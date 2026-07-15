import { TokenSymbol } from 'store/network'
// Type-only import — erased at runtime, so this stays a lightweight consts
// module (no dependency on the icon-heavy TokenIcon module) and introduces no
// circular import even though TokenIcon imports the mapping below.
import type { NetworkTokenSymbols } from 'common/components/TokenIcon'

export const CHAIN_IDS_WITH_INCORRECT_SYMBOL = [
  10, 8453, 42161, 96786, 7888, 379
]

export const L2_NETWORK_SYMBOL_MAPPING: Record<number, TokenSymbol> = {
  [10]: TokenSymbol.OP,
  [42161]: TokenSymbol.ARB,
  [8453]: TokenSymbol.BASE,
  [56]: TokenSymbol.BNB
}

// Resolve the corrected network token symbol for chains whose native symbol is
// wrong upstream (see `L2_NETWORK_SYMBOL_MAPPING`). Returns `undefined` when the
// chainId is absent or not in the mapping.
export const getNetworkSymbol = (
  chainId?: number
): NetworkTokenSymbols | undefined =>
  chainId
    ? (L2_NETWORK_SYMBOL_MAPPING[chainId] as NetworkTokenSymbols)
    : undefined
