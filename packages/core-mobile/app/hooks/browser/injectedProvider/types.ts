import type { Dispatch } from '@reduxjs/toolkit'
import type { Networks } from 'store/network/types'
import type { TabId } from 'store/browser/types'
import type { PeerMeta } from 'store/rpc/types'
import type { Request as InAppRequest } from 'store/rpc/utils/createInAppRequest'

// Upper bound (1 MiB) on a single provider message from the WebView. The
// payload is attacker-controlled — any page can call
// `window.ReactNativeWebView.postMessage(...)` — so we reject oversized
// messages before `JSON.parse` to avoid blocking the JS thread or OOMing the
// app. Legitimate EVM RPC payloads are KB-scale, so this is a sanity ceiling,
// not a functional limit.
export const MAX_MESSAGE_SIZE = 1_048_576

export type ProviderRequest = {
  id: number
  origin?: string
  request: {
    method: string
    params: unknown
  }
}

export type DomainMetadata = {
  domain: string
  name: string
  icon: string
  url: string
}

export type BrowserNetwork = {
  chainId: number
  rpcUrl: string
}

export type RouterDeps = {
  getBrowserNetwork: () => BrowserNetwork
  setBrowserNetwork: (net: BrowserNetwork) => void
  getAllNetworks: () => Networks

  tabId: TabId

  dispatch: Dispatch
  requestSigning: InAppRequest

  sendResponse: (id: number, error: unknown, result: unknown) => void
  emitEvent: (eventName: string, data: unknown) => void

  getNativeOrigin: () => string | undefined
  trackPendingOrigin: (id: number, origin: string) => void

  getPeerMeta: () => PeerMeta
}
