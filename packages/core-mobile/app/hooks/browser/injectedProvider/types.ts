import type { Dispatch } from '@reduxjs/toolkit'
import type { NetworkVMType } from '@avalabs/core-chains-sdk'
import type { Networks } from 'store/network/types'
import type { TabId } from 'store/browser/types'
import type { PeerMeta } from 'store/rpc/types'
import type { Request as InAppRequest } from 'store/rpc/utils/createInAppRequest'
import type { Account } from 'store/account'

export const MAX_MESSAGE_SIZE = 1_048_576

export type ProviderRequest = {
  id: number
  origin?: string
  request: {
    method: string
    params: unknown[]
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

  getPeerMeta: () => PeerMeta | undefined
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
  // Resolves with user-selected accounts, rejects with `{code:4001,message}` on cancel.
  requestConnectApproval: (peerMeta: PeerMeta) => Promise<Account[]>
}
