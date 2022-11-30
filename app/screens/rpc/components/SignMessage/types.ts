import { PeerMeta } from 'services/walletconnect/types'

export interface MessageAction {
  id?: string | number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  displayData: any
  method: string
  site: PeerMeta
}
