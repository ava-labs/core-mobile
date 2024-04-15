import { AppListenerEffectAPI } from 'store'
import { Result } from 'types/result'
import { Request, RpcMethod, RpcError } from '../types'

export type HandleResponse<Response = unknown> = Promise<
  Result<symbol | Response, RpcError>
>

export type ApproveResponse<Response = unknown> = Promise<
  Result<Response, RpcError>
>

export interface RpcRequestHandler<
  R extends Request,
  HandleResponseType = unknown,
  ApproveResponseType = unknown,
  ApproveDataType = unknown | undefined
> {
  methods: RpcMethod[]
  handle: (
    request: R,
    listenerApi: AppListenerEffectAPI
  ) => HandleResponse<HandleResponseType>
  approve?: (
    payload: { request: R; data: ApproveDataType },
    listenerApi: AppListenerEffectAPI
  ) => ApproveResponse<ApproveResponseType>
}

export const DEFERRED_RESULT = Symbol()

export enum AvalancheChainStrings {
  AVM = 'X Chain',
  PVM = 'P Chain',
  EVM = 'C Chain'
}
