import { AppListenerEffectAPI } from 'store'
import { SessionProposal, SessionRequest, RpcMethod, RpcError } from '../types'

export type HandleResponse = Promise<Result<symbol | unknown, RpcError>>

export type ApproveResponse = Promise<Result<unknown, RpcError>>

export interface RpcRequestHandler<
  Request extends SessionProposal | SessionRequest<RpcMethod>
> {
  methods: RpcMethod[]
  handle: (
    request: Request,
    listenerApi: AppListenerEffectAPI
  ) => HandleResponse
  approve?: (
    payload: { request: Request; data?: unknown },
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
