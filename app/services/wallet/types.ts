import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BitcoinInputUTXO, BitcoinOutputUTXO } from '@avalabs/wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs-v2'
import WalletService from 'services/wallet/WalletService'
import NetworkService from 'services/network/NetworkService'
import { Account } from 'store/account'
import BN from 'bn.js'

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

export type ExportCParams = {
  /**
   * in nAvax
   */
  requiredAmount: BN
  walletService: typeof WalletService
  networkService: typeof NetworkService
  activeAccount: Account
  isDevMode: boolean
}

export type ImportPParams = {
  walletService: typeof WalletService
  networkService: typeof NetworkService
  activeAccount: Account
  isDevMode: boolean
}
