import { BitcoinInputUTXO, BitcoinOutputUTXO } from '@avalabs/wallets-sdk'
import { TransactionRequest } from '@ethersproject/providers'

export type SignTransactionRequest = TransactionRequest | BtcTransactionRequest
export interface BtcTransactionRequest {
  inputs: BitcoinInputUTXO[]
  outputs: BitcoinOutputUTXO[]
}
