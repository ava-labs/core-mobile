import { RpcRequest, DisplayData, SigningData } from '@avalabs/vm-module-types'
import { ProposalTypes } from '@walletconnect/types'
import { SiteScanResponse } from 'services/blockaid/types'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Network } from '@avalabs/core-chains-sdk'
import { AvalancheSetDeveloperModeRpcRequest } from 'store/rpc/handlers/avalanche_setDeveloperMode/types'
import { AvalancheSetDeveloperModeApproveData } from 'store/rpc/handlers/avalanche_setDeveloperMode/types'
import { AvalancheCreateContactRequest } from 'store/rpc/handlers/contact/avalanche_createContact/avalanche_createContact'
import { AvalancheRemoveContactRequest } from 'store/rpc/handlers/contact/avalanche_removeContact/avalanche_removeContact'
import { AvalancheUpdateContactRequest } from 'store/rpc/handlers/contact/avalanche_updateContact/avalanche_updateContact'
import { Contact } from 'store/addressBook/types'
import { WalletAddEthereumChainRpcRequest } from 'store/rpc/handlers/chain/wallet_addEthereumChain/wallet_addEthereumChain'
import { Account } from 'store/account'
import { WalletType } from 'services/wallet/types'
import { UR } from '@ngraveio/bc-ur'

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
    walletId,
    walletType,
    network,
    account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    overrideData
  }: {
    walletId: string
    walletType: WalletType
    network: Network
    account: Account
    maxFeePerGas?: bigint
    maxPriorityFeePerGas?: bigint
    overrideData?: string
  }) => Promise<void>
  onReject: (message?: string) => void
}

export type KeystoneSignerParams = {
  request: UR
  responseURTypes: string[]
  onApprove: (cbor: Buffer) => Promise<void>
  onReject: (message?: string) => void
}

export type KeystoneTroubleshootingParams = {
  errorCode: number
  retry: () => void
}

export type SetDeveloperModeParams = {
  request: AvalancheSetDeveloperModeRpcRequest
  data: AvalancheSetDeveloperModeApproveData
}

export type EditContactParams = {
  request:
    | AvalancheCreateContactRequest
    | AvalancheRemoveContactRequest
    | AvalancheUpdateContactRequest
  contact: Contact
  action: 'create' | 'remove' | 'update'
}

export type AddEthereumChainParams = {
  request: WalletAddEthereumChainRpcRequest
  network: Network
}
