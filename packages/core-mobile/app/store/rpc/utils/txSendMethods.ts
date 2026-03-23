import { RpcMethod } from 'store/rpc/types'

export const TX_SEND_METHODS = [
  RpcMethod.ETH_SEND_TRANSACTION,
  RpcMethod.AVALANCHE_SEND_TRANSACTION,
  RpcMethod.BITCOIN_SEND_TRANSACTION,
  RpcMethod.SOLANA_SIGN_AND_SEND_TRANSACTION
] as const

export type TxSendMethod = typeof TX_SEND_METHODS[number]

export type TxSendSuccessEvent = `${TxSendMethod}_success`
export type TxSendConfirmedEvent = `${TxSendMethod}_confirmed`
export type TxSendFailedEvent = `${TxSendMethod}_failed`

export const isTxSendMethod = (method: string): method is TxSendMethod =>
  (TX_SEND_METHODS as readonly string[]).includes(method)
