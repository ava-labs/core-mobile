import {
  RpcRequest,
  DisplayData,
  SigningData,
  ERC20Token
} from '@avalabs/vm-module-types'
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
import { WalletWatchAssetRpcRequest } from 'store/rpc/handlers/chain/wallet_watchAsset/wallet_watchAsset'
import { Account } from 'store/account'
import { WalletType } from 'services/wallet/types'

export type SessionProposalParams = {
  request: WCSessionProposal
  namespaces: Record<string, ProposalTypes.RequiredNamespace>
  scanResponse?: SiteScanResponse
}

export type OnApproveParams = {
  walletId: string
  walletType: WalletType
  network: Network
  account: Account
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  gasLimit?: number
  overrideData?: string
  onSigned?: () => Promise<boolean>
}

export type ApprovalParams = {
  request: RpcRequest
  displayData: DisplayData
  signingData: SigningData
  /**
   * The in-flight request's AbortSignal, present only for cancellable injected
   * browser signing requests. A cross-origin nav can abort + settle the request
   * in the window between navigating to the approval screen and the screen
   * mounting, so the generic dismissal may miss; the screen reads this to
   * self-dismiss on mount if its request is already cancelled. (CP-14422)
   */
  signal?: AbortSignal
  onApprove: ({
    walletId,
    walletType,
    network,
    account,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit,
    overrideData
  }: OnApproveParams) => Promise<void>
  onReject: (message?: string) => void
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

export type WatchAssetParams = {
  request: WalletWatchAssetRpcRequest
  token: ERC20Token
}
