import { PeerMeta } from 'store/rpc/types'

/**
 * The origin to name on the switch-chain prompt. For the in-app browser
 * `peerMeta.url` is derived from the WebView's committed top-level URL (never
 * page-supplied), so it identifies the requesting site; fall back to the name.
 */
export const getSwitchChainOrigin = (peerMeta: PeerMeta): string => {
  try {
    return new URL(peerMeta.url).host || peerMeta.name
  } catch {
    return peerMeta.name
  }
}
