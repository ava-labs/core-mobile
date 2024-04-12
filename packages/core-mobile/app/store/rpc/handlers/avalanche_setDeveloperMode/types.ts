import { RpcMethod, RpcRequest } from 'store/rpc/types'

export type AvalancheSetDeveloperModeRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_SET_DEVELOPER_MODE>

export type AvalancheSetDeveloperModeApproveData = {
  enabled: boolean
}
