import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BitcoinInputUTXO, BitcoinOutputUTXO } from '@avalabs/wallets-sdk'

export type SignTransactionRequest =
  | TransactionRequest
  | {
      inputs: BitcoinInputUTXO[]
      outputs: BitcoinOutputUTXO[]
    }
