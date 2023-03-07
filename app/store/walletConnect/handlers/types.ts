import { PeerMeta } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { RpcError, RpcMethod } from 'store/walletConnectV2'
import { OutputOwners, TransferableOutput, VM } from '@avalabs/avalanchejs-v2'
import { GetAssetDescriptionResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/common'

export interface TypedJsonRpcRequest<Method extends string, Params = unknown>
  extends JsonRpcRequest<Params> {
  method: Method
  peerMeta: PeerMeta
  peerId: string
}

export interface DappRpcRequest<Method extends string, Params = unknown> {
  payload: TypedJsonRpcRequest<Method, Params>
}

export type HandleResponse = Promise<Result<symbol | unknown, RpcError>>

export type ApproveResponse = Promise<Result<unknown, RpcError>>

export interface RpcRequestHandler<
  Request extends DappRpcRequest<string, unknown>,
  ApproveData
> {
  methods: RpcMethod[]
  handle: (
    request: Request,
    listenerApi: AppListenerEffectAPI
  ) => HandleResponse
  approve?: (
    payload: { request: Request; data: ApproveData },
    listenerApi: AppListenerEffectAPI
  ) => ApproveResponse
}

export type Result<Value, Error> =
  | {
      success: true
      value?: Value
    }
  | {
      success: false
      error: Error
    }

export const DEFERRED_RESULT = Symbol()

/**
 * Types for parsed transaction
 */
export type AvalancheTxType =
  | AddValidatorTx
  | AddDelegatorTx
  | ExportTx
  | ImportTx
  | AvalancheBaseTx
  | UnknownTx

export interface AvalancheTx {
  type: string
  chain: VM
  txFee: bigint
}

export interface AvalancheBaseTx extends AvalancheTx {
  type: 'base'
  chain: 'AVM'
  outputs: {
    assetId: string
    locktime: bigint
    threshold: bigint
    amount: bigint
    assetDescription?: GetAssetDescriptionResponse
    owners: string[]
    isAvax: boolean
  }[]
  memo?: string
}

export interface AddValidatorTx extends AvalancheTx {
  type: 'add_validator'
  nodeID: string
  fee: number
  start: string
  end: string
  rewardOwner: OutputOwners
  stake: bigint
  stakeOuts: TransferableOutput[]
}

export interface AddDelegatorTx extends AvalancheTx {
  type: 'add_delegator'
  nodeID: string
  start: string
  end: string
  rewardOwner: OutputOwners
  stake: bigint
  stakeOuts: TransferableOutput[]
}

export interface ExportTx extends AvalancheTx {
  type: 'export'
  destination: VM
  amount: bigint
  exportOuts: TransferableOutput[]
}

export interface ImportTx extends AvalancheTx {
  type: 'import'
  source: VM
  amount: bigint
}

export interface UnknownTx extends AvalancheTx {
  type: 'unknown'
}

export type SendTransactionApproveData = {
  unsignedTxJson: string
  txBuffer: Buffer
  txData: AvalancheTxType
  vm: VM
}
