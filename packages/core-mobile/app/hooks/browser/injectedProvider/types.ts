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

  // Read-only RPC routed through the VM module (the same `module.onRpcRequest`
  // path WalletConnect uses) instead of a bespoke fetch + allowlist. Resolves
  // with the JSON-RPC result; rejects with an RpcError for the known cases
  // (methodNotFound when the manifest doesn't permit the method, internal
  // otherwise), but may also reject with other thrown values, which
  // `sendResponse` serializes. The module manifest is the single source of
  // read-only method classification.
  requestReadOnly: (args: {
    id: number
    method: string
    params: unknown
    chainId: number
  }) => Promise<unknown>

  sendResponse: (id: number, error: unknown, result: unknown) => void
  emitEvent: (eventName: string, data: unknown) => void

  getNativeOrigin: () => string | undefined
  trackPendingOrigin: (id: number, origin: string) => void

  getPeerMeta: () => PeerMeta
  getActiveAccount: () => Account | undefined

  // Permissions
  /**
   * Every address at `domain` granted for `vmType`. Used by
   * `wallet_getPermissions` / `eth_requestAccounts` so that switching the
   * active wallet account does not spuriously disconnect a dApp that was
   * previously authorized for some other address.
   */
  getGrantedAddresses: (args: {
    domain: string
    vmType: NetworkVMType
  }) => string[]
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

  // Connect approval — hook implements: register the request in the per-tab-keyed
  // connect-approval registry (which mints a unique approvalId from tabId +
  // requestId + a nonce) and navigate to the authorize screen. `requestId` is
  // the JSON-RPC request id, passed as context (concurrent tabs are coordinated
  // by the registry, CP-14385). Resolves with user-selected accounts, rejects
  // with EIP-1193 user-rejected on cancel.
  requestConnectApproval: (
    peerMeta: PeerMeta,
    requestId: number
  ) => Promise<Account[]>
}
