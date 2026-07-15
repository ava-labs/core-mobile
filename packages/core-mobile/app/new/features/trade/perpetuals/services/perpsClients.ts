import {
  MAINNET_API_URL,
  MAINNET_WS_URL,
  createHyperliquidWsClient,
  createInfoClient,
  type HyperliquidWsClient,
  type InfoClient
} from '@avalabs/perps-sdk'
import { fetch as nitroFetch } from 'react-native-nitro-fetch'

/**
 * Shared read-only REST client for Hyperliquid `/info`. Hits the public
 * mainnet endpoint directly (perps are mainnet-only in Core). Uses the app's
 * nitro fetch for parity with the rest of the networking stack.
 */
let infoClient: InfoClient | undefined

export const getPerpsInfoClient = (): InfoClient => {
  if (infoClient === undefined) {
    infoClient = createInfoClient({
      baseUrl: MAINNET_API_URL,
      fetch: nitroFetch as unknown as typeof fetch
    })
  }
  return infoClient
}

/**
 * Create a fresh Hyperliquid WebSocket client. Callers own the lifecycle
 * (`connect`/`disconnect`) so each subscribing hook can tear its socket down
 * on unmount. RN provides a global `WebSocket`, so no impl override is needed.
 */
export const createPerpsWsClient = (): HyperliquidWsClient =>
  createHyperliquidWsClient({ url: MAINNET_WS_URL })
