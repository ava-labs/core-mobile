import { SessionProposalData } from 'services/walletconnectv2/types'
import { RpcMethod } from 'store/rpc/types'

export type WCSessionProposal = {
  data: SessionProposalData
  method: RpcMethod.SESSION_REQUEST
}

export enum WalletConnectVersions {
  V1 = '1',
  V2 = '2'
}
