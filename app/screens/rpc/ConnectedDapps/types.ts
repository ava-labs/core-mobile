import { Session } from 'services/walletconnectv2/types'
import { ApprovedAppMeta } from 'store/walletConnect'
import { WalletConnectVersions } from 'store/walletConnectV2'

export type Dapp =
  | {
      id: string // the peer id
      dapp: ApprovedAppMeta
      version: WalletConnectVersions.V1
    }
  | {
      id: string // the session topic
      dapp: Session
      version: WalletConnectVersions.V2
    }
