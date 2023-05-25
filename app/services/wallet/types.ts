import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BitcoinInputUTXO, BitcoinOutputUTXO } from '@avalabs/wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'

export type SignTransactionRequest =
  | TransactionRequest
  | BtcTransactionRequest
  | AvalancheTransactionRequest

export interface BtcTransactionRequest {
  inputs: BitcoinInputUTXO[]
  outputs: BitcoinOutputUTXO[]
}

export interface AvalancheTransactionRequest {
  tx: UnsignedTx
  externalIndices?: number[]
  internalIndices?: number[]
}

/**
 * Used for X and P chain transactions
 * Copied from browser extension, evm currently not used in mobile, but
 * will probably be needed for Ledger implementation
 */
export type PubKeyType = {
  evm: string
  /**
   * Public keys used for X/P chain are from a different derivation path.
   */
  xp?: string
}
