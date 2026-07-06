import { RpcRequest } from '@avalabs/vm-module-types'
import { CORE_MOBILE_META } from '../types'
import { isInAppRequest } from './isInAppRequest'

/**
 * Whether a request originated from a dApp (WalletConnect OR the injected
 * browser) as opposed to a wallet-internal flow (Send / Swap / Stake / Bridge).
 *
 * Wallet-internal requests are minted by `generateInAppRequestPayload` with the
 * `CORE_MOBILE_META` peerMeta fallback (url `https://core.app/`); both dApp paths
 * carry the dApp's real origin url. This is the correct discriminator for
 * per-network dApp-transaction analytics (MTU) — unlike `isInAppRequest`, which
 * keys on the session topic and so lumps the injected browser in with
 * wallet-internal flows.
 *
 * An empty url (the `getPeerMeta()` placeholder for an unparseable WebView URL)
 * is treated as NOT a dApp so we never emit an empty-`dAppUrl` analytics record.
 *
 * Known limitation: the `CORE_MOBILE_META` url (`https://core.app/`) doubles as a
 * real, browsable domain. A dApp transaction made against the real core.app site
 * inside the in-app browser is therefore misclassified as wallet-internal and not
 * counted. This is a narrow edge (the exact root url only) and is not a regression
 * — core.app via the injected provider emitted nothing before this change either.
 * Removing it would require an explicit context marker instead of a url compare.
 */
export const isDappOriginatedUrl = (url?: string): boolean =>
  !!url && url !== CORE_MOBILE_META.url

/**
 * Whether a request came from the in-app injected browser provider, as opposed
 * to WalletConnect or a wallet-internal flow.
 *
 * Both the injected browser and wallet-internal flows (Send / Swap / Stake /
 * Bridge) ride the in-app session topic (`CORE_MOBILE_TOPIC`), so `isInAppRequest`
 * alone does NOT mean "injected". The discriminator is the combination:
 *   - dApp-originated url (carries a real origin, not `CORE_MOBILE_META`) — this
 *     excludes wallet-internal flows, which never set a peerMeta; AND
 *   - in-app session topic — this excludes WalletConnect, which carries a real
 *     WC session topic.
 *
 * Used to label per-network dApp-transaction analytics (MTU) by transport
 * (injected vs WalletConnect). CP-13825.
 */
export const isInjectedDappRequest = (request: RpcRequest): boolean =>
  isDappOriginatedUrl(request.dappInfo?.url) && isInAppRequest(request)
