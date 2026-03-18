import type { LocalTokenWithBalance } from 'store/balance'

/**
 * Returns a key that uniquely identifies a token per network.
 * Prefers internalId over localId (falls back when internalId is absent) combined
 * with networkChainId, because native tokens share the same id across EVM chains
 * (e.g. NATIVE-eth on Ethereum vs Base).
 */
export const getTokenKey = (token: LocalTokenWithBalance): string =>
  `${token.internalId ?? token.localId}-${token.networkChainId}`
