import { SessionProposalData } from 'services/walletconnectv2/types'
import { RpcMethod, RpcProvider } from 'store/rpc/types'

export type WCSessionProposal = {
  data: SessionProposalData
  method: RpcMethod.WC_SESSION_REQUEST
  provider: RpcProvider.WALLET_CONNECT
}

export enum WalletConnectVersions {
  V1 = '1',
  V2 = '2'
}
