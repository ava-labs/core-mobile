import { RpcMethod, RpcRequest } from 'store/rpc/types'

export type AvalancheSignMessageResult = string

export type AvalancheSignMessageRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_SIGN_MESSAGE>
