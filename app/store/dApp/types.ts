import { IWalletConnectSession } from '@walletconnect/types'

export type ApprovedAppMeta = IWalletConnectSession & { uri: string }

export type DAppsState = {
  approvedDApps: ApprovedAppMeta[]
}
