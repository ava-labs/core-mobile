import { AppListenerEffectAPI } from 'store'
import { SessionProposal, SessionRequest, RpcMethod, RpcError } from '../types'

export type HandleResponse<Response = unknown> = Promise<
  Result<symbol | Response, RpcError>
>

export type ApproveResponse<Response = unknown> = Promise<
  Result<Response, RpcError>
>

export interface RpcRequestHandler<
  Request extends SessionProposal | SessionRequest<RpcMethod>,
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
