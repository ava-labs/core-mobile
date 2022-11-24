import { DappRpcRequest } from './handlers/types'

export type RpcState = {
  requests: DappRpcRequest<string, unknown>[]
}
