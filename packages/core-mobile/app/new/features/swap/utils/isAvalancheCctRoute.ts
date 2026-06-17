import { TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import type { LocalTokenWithBalance } from 'store/balance'

const AVALANCHE_PRIMARY_NETWORK_CHAIN_IDS = new Set<number>([
  ChainId.AVALANCHE_MAINNET_ID,
  ChainId.AVALANCHE_TESTNET_ID,
  ChainId.AVALANCHE_P,
  ChainId.AVALANCHE_TEST_P,
  ChainId.AVALANCHE_X,
  ChainId.AVALANCHE_TEST_X
])

const isAvalanchePrimaryNetworkChainId = (
  chainId: number | undefined
): boolean =>
  chainId !== undefined && AVALANCHE_PRIMARY_NETWORK_CHAIN_IDS.has(chainId)

/**
 * True for native AVAX on any Avalanche Primary Network chain (C, P, X).
 * Type predicate so callers can narrow `LocalTokenWithBalance | undefined`
 * to a defined token after the check.
 */
export const isNativeAvaxToken = (
  token: LocalTokenWithBalance | undefined
): token is LocalTokenWithBalance =>
  token !== undefined &&
  token.type === TokenType.NATIVE &&
  token.symbol === 'AVAX' &&
  isAvalanchePrimaryNetworkChainId(token.networkChainId)

/**
 * True when the from/to token pair would route through the AVALANCHE_CCT
 * service: both native AVAX, both on Avalanche Primary Network chains, but on
 * different chains. Lets the UI detect a CCT route before a live quote arrives.
 */
export const isAvalancheCctRoute = ({
  fromToken,
  toToken
}: {
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
}): boolean => {
  if (!isNativeAvaxToken(fromToken) || !isNativeAvaxToken(toToken)) {
    return false
  }
  return fromToken.networkChainId !== toToken.networkChainId
}
