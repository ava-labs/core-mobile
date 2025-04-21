import { ProposalTypes } from '@walletconnect/types'
import { SiteScanResponse } from 'services/blockaid/types'
import { WCSessionProposal } from 'store/walletConnectV2/types'

export type SessionProposalV2Params = {
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
  scanResponse?: SiteScanResponse
}
