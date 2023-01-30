import { Dispatch } from 'react'
import { DappRpcRequest } from 'store/walletConnect/handlers/types'
import { ApprovedAppMeta } from 'store/walletConnect'

export interface DappConnectionState {
  pendingDeepLink: DeepLink | undefined
  setPendingDeepLink: Dispatch<DeepLink>
  onUserApproved: (
    request: DappRpcRequest<string, unknown>,
    data?: unknown // any extra data that you want to send to the store
  ) => void
  onUserRejected: (
    request: DappRpcRequest<string, unknown>,
    message?: string
  ) => void
  killSessions: (sessions: ApprovedAppMeta[]) => void
}

export interface DeepLink {
  url: string
  origin: DeepLinkOrigin
}

export enum DeepLinkOrigin {
  ORIGIN_DEEPLINK = 'deeplink',
  ORIGIN_QR_CODE = 'qr-code'
}

export const PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https',
  WC: 'wc'
}

export const ACTIONS = {
  WC: 'wc'
}
