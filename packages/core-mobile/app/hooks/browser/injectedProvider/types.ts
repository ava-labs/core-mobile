import type { Dispatch } from '@reduxjs/toolkit'
import type { Networks } from 'store/network/types'
import type { TabId } from 'store/browser/types'
import type { PeerMeta } from 'store/rpc/types'
import type { Request as InAppRequest } from 'store/rpc/utils/createInAppRequest'

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
}
