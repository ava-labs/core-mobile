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

// X- and P-Chain only. These chains expose nothing but native AVAX and route
// exclusively through AVALANCHE_CCT, so their only valid swap destination is
// native AVAX on a different primary-network chain.
const AVALANCHE_XP_CHAIN_IDS = new Set<number>([
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
 * True for native AVAX on the X- or P-Chain. Those chains hold only native AVAX
 * and route exclusively through AVALANCHE_CCT, so a valid destination is always
 * native AVAX on a different primary-network chain — never an ERC-20 such as
 * USDC. Callers use this to clear a stale to-token (e.g. USDC carried over from
 * a prior C-Chain source) once the from-token becomes an X/P AVAX source.
 */
export const isCctOnlySource = (
  token: LocalTokenWithBalance | undefined
): token is LocalTokenWithBalance =>
  isNativeAvaxToken(token) && AVALANCHE_XP_CHAIN_IDS.has(token.networkChainId)

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

/**
 * True when a 0 input amount is valid for the selected pair: an enabled
 * AVALANCHE_CCT route. In that state the SDK emits an import-only recovery
 * quote for `amountIn=0`, letting a user recover stranded funds straight from
 * the swap screen (and the submit button reads "Recover"). Mirrors core-web's
 * `isAvalancheCctZeroAmountQuoteRoute`.
 */
export const isAvalancheCctZeroAmountRoute = ({
  isAvalancheCctEnabled,
  fromToken,
  toToken
}: {
  isAvalancheCctEnabled: boolean
  fromToken: LocalTokenWithBalance | undefined
  toToken: LocalTokenWithBalance | undefined
}): boolean =>
  isAvalancheCctEnabled && isAvalancheCctRoute({ fromToken, toToken })
