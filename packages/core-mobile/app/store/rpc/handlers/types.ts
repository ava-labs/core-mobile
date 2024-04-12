import { AppListenerEffectAPI } from 'store'
import { Result } from 'types/result'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { RpcRequest, RpcMethod, RpcError } from '../types'

export type HandleResponse<Response = unknown> = Promise<
  Result<symbol | Response, RpcError>
>

export type ApproveResponse<Response = unknown> = Promise<
  Result<Response, RpcError>
>

export interface RpcRequestHandler<
  Request extends WCSessionProposal | RpcRequest<RpcMethod>,
  HandleResponseType = unknown,
  ApproveResponseType = unknown,
  ApproveDataType = unknown | undefined
> {
  methods: RpcMethod[]
  handle: (
    request: Request,
    listenerApi: AppListenerEffectAPI
  ) => HandleResponse<HandleResponseType>
  approve?: (
    payload: { request: Request; data: ApproveDataType },
    listenerApi: AppListenerEffectAPI
  ) => ApproveResponse<ApproveResponseType>
}

export const DEFERRED_RESULT = Symbol()

export enum AvalancheChainStrings {
  AVM = 'X Chain',
  PVM = 'P Chain',
  EVM = 'C Chain'
}
