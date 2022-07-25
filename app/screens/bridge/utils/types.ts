import { Asset, BridgeTransaction } from '@avalabs/bridge-sdk'
import Big from 'big.js'

export type PartialBridgeTransaction = Pick<
  BridgeTransaction,
  | 'sourceChain'
  | 'sourceTxHash'
  | 'sourceStartedAt'
  | 'targetChain'
  | 'amount'
  | 'symbol'
>

export type BTCTransactionResponse = {
  block_height: number
  block_index: number
  hash: string
  addresses: string[]
  total: number
  fees: number
  size: number
  vsize: number
  preference: string
  relayed_by: string
  received: string
  ver: number
  double_spend: boolean
  vin_sz: number
  vout_sz: number
  confirmations: number
  inputs: import('@avalabs/blockcypher-sdk').TxInput[]
  outputs: import('@avalabs/blockcypher-sdk').TxOutput[]
}

export interface AssetBalance {
  symbol: string
  asset: Asset
  balance: Big | undefined
}
