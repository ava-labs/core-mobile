import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BitcoinInputUTXO, BitcoinOutputUTXO } from '@avalabs/wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import { Network } from '@avalabs/chains-sdk'

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

export type AddDelegatorProps = {
  accountIndex: number
  avaxXPNetwork: Network
  // Id of the node to delegate. starts with “NodeID-”
  nodeId: string
  //Amount to be delegated in nAVAX
  stakeAmount: bigint
  // The Unix time when the delegation starts.
  startDate: number
  // The Unix time when the delegation ends.
  endDate: number
  // The addresses which will receive the rewards from the delegated stake.
  rewardAddress: string
  isDevMode: boolean
}
