import { CorePrimaryAccount } from '@avalabs/types'
import { RpcRequest, DisplayData, SigningData } from '@avalabs/vm-module-types'
import { ProposalTypes } from '@walletconnect/types'
import { SiteScanResponse } from 'services/blockaid/types'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Network } from '@avalabs/core-chains-sdk'

export type SessionProposalParams = {
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
  scanResponse?: SiteScanResponse
}

export type ApprovalParams = {
  request: RpcRequest
  displayData: DisplayData
  signingData: SigningData
  onApprove: ({
    network,
    account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    overrideData
  }: {
    network: Network
    account: CorePrimaryAccount
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    overrideData?: string
  }) => Promise<void>
  onReject: (message?: string) => void
}
