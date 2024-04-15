import { RpcMethod, RpcRequest } from 'store/rpc/types'

export type AvalancheGetAddressesInRangeRpcRequest =
  RpcRequest<RpcMethod.AVALANCHE_GET_ADDRESSES_IN_RANGE>

export type RequestParams = [number, number, number, number]
