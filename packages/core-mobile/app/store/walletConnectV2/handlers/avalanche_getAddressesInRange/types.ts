import { RpcMethod, SessionRequest } from 'store/walletConnectV2/types'

export type AvalancheGetAddressesInRangeRpcRequest =
  SessionRequest<RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE>

export type RequestParams = [number, number, number, number]
