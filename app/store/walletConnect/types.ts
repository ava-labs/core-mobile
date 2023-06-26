import { IWalletConnectSession } from '@walletconnect/legacy-types'

export type ApprovedAppMeta = IWalletConnectSession & { uri: string }

export type WalletConnectState = {
  requestStatuses: Record<string, { result?: unknown; error?: Error }>
  approvedDApps: ApprovedAppMeta[]
}
