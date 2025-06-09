import { TokenSymbol } from 'store/network'

export const CHAIN_IDS_WITH_INCORRECT_SYMBOL = [
  10, 8453, 42161, 96786, 7888, 379
]

export const L2_NETWORK_SYMBOL_MAPPING: Record<number, TokenSymbol> = {
  [10]: TokenSymbol.OP,
  [42161]: TokenSymbol.ARB,
  [8453]: TokenSymbol.BASE,
  [56]: TokenSymbol.BNB
}
