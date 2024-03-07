import { RpcMethod, SessionRequest } from 'store/walletConnectV2/types'

export type AvalancheSetDeveloperModeRpcRequest =
  SessionRequest<RpcMethod.AVALANCHE_SET_DEVELOPER_MODE>

export type AvalancheSetDeveloperModeApproveData = {
  enabled: boolean
}
