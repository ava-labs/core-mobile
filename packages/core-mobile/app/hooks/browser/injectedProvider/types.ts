import type { Dispatch } from '@reduxjs/toolkit'
import type { NetworkVMType } from '@avalabs/core-chains-sdk'
import type { Networks } from 'store/network/types'
import type { TabId } from 'store/browser/types'
import type { PeerMeta } from 'store/rpc/types'
import type { Request as InAppRequest } from 'store/rpc/utils/createInAppRequest'
import type { Account } from 'store/account'

// Upper bound (1 MiB) on a single provider message from the WebView. The
// payload is attacker-controlled — any page can call
// `window.ReactNativeWebView.postMessage(...)` — so we reject oversized
// messages (a best-effort `JSON.parse` is attempted only to recover the `id`
// for the error response) rather than dispatching them, avoiding the JS-thread
// block / OOM risk of processing huge payloads. Legitimate EVM RPC payloads
// are KB-scale, so this is a sanity ceiling, not a functional limit.
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
  getActiveAccount: () => Account | undefined

  // Permissions
  hasPermission: (args: {
    domain: string
    address: string
    vmType: NetworkVMType
  }) => boolean
  grantPermission: (args: {
    domain: string
    address: string
    vmType: NetworkVMType
  }) => void
  revokePermission: (args: {
    domain: string
    address?: string
    vmType?: NetworkVMType
  }) => void

  // Connect approval — hook implements: stash in cache + navigate + park a promise.
  // Resolves with user-selected accounts, rejects with EIP-1193 user-rejected on cancel.
  requestConnectApproval: (peerMeta: PeerMeta) => Promise<Account[]>
}
