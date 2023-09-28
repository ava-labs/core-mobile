import { Session } from 'services/walletconnectv2/types'
import { WalletConnectVersions } from 'store/walletConnectV2'

export type Dapp = {
  id: string // the session topic
  dapp: Session
  version: WalletConnectVersions.V2
}
