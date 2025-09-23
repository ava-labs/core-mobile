import { TransactionRequest } from 'ethers'
import {
  Avalanche,
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import { pvm, UnsignedTx } from '@avalabs/avalanchejs'
import { Network } from '@avalabs/core-chains-sdk'
import {
  MessageTypes,
  RpcMethod,
  TypedData,
  TypedDataV1
} from '@avalabs/vm-module-types'
import { SolanaProvider } from '@avalabs/core-wallets-sdk'
import { Curve } from 'utils/publicKeys'

export type SignTransactionRequest =
  | TransactionRequest
  | BtcTransactionRequest
  | AvalancheTransactionRequest
  | SolanaTransactionRequest

export interface BtcTransactionRequest {
  inputs: BitcoinInputUTXO[]
  outputs: BitcoinOutputUTXO[]
}

export interface AvalancheTransactionRequest {
  tx: UnsignedTx
  externalIndices?: number[]
  internalIndices?: number[]
}

export interface SolanaTransactionRequest {
  account: string
  serializedTx: string
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
  // Id of the node to delegate. starts with "NodeID-"
  nodeId: string
  //Amount to be delegated in nAVAX
  stakeAmountInNAvax: bigint
  // The Unix time when the delegation starts.
  startDate: number
  // The Unix time when the delegation ends.
  endDate: number
  // The addresses which will receive the rewards from the delegated stake.
  rewardAddress: string
  isDevMode: boolean
  shouldValidateBurnedAmount?: boolean
  feeState?: pvm.FeeState
  pFeeAdjustmentThreshold: number
}

export interface CommonAvalancheTxParamsBase {
  accountIndex: number
  avaxXPNetwork: Network
  destinationAddress: string | undefined
  shouldValidateBurnedAmount?: boolean
  feeState?: pvm.FeeState
}

export type CreateExportCTxParams = CommonAvalancheTxParamsBase & {
  /**
   * In `Nano Avax`
   */
  amountInNAvax: bigint
  /**
   * In `Nano Avax`
   */
  baseFeeInNAvax: bigint
  destinationChain: 'P' | 'X'
}

export type CreateImportPTxParams = CommonAvalancheTxParamsBase & {
  sourceChain: 'C' | 'X'
}

export type CreateExportPTxParams = CommonAvalancheTxParamsBase & {
  amountInNAvax: bigint
  destinationChain: 'C' | 'X'
}

export type CreateImportCTxParams = CommonAvalancheTxParamsBase & {
  /**
   * In `Nano Avax`
   */
  baseFeeInNAvax: bigint
  sourceChain: 'P' | 'X'
}

export type CreateSendPTxParams = CommonAvalancheTxParamsBase & {
  /**
   * In `nAvax`
   */
  amountInNAvax: bigint
  sourceAddress: string
  feeState?: pvm.FeeState
}

//TODO: delete this enum
export enum WalletType {
  UNSET = 'UNSET',
  SEEDLESS = 'SEEDLESS',
  MNEMONIC = 'MNEMONIC',
  PRIVATE_KEY = 'PRIVATE_KEY',
  LEDGER = 'LEDGER',
  LEDGER_LIVE = 'LEDGER_LIVE'
}

/**
 * Interface representing a universal wallet with common methods for
 * signing message/transaction and retrieving wallet infos (addresses, public key)
 */
export interface Wallet {
  /**
   * Signs a message using the specified account, network, and provider.
   * @param rpcMethod - The RPC method for the message.
   * @param data - The data to be signed.
   * @param accountIndex - The index of the account.
   * @param network - The network type.
   * @param provider - The JSON RPC provider
   */
  signMessage({
    rpcMethod,
    data,
    accountIndex,
    network,
    provider
  }: {
    rpcMethod: RpcMethod
    data: string | TypedDataV1 | TypedData<MessageTypes>
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal | Avalanche.JsonRpcProvider | SolanaProvider
  }): Promise<string>

  /**
   * Signs a Bitcoin transaction using the specified account, transaction request, network, and Bitcoin provider.
   * @param accountIndex - The index of the account.
   * @param transaction - The Bitcoin transaction request.
   * @param network - The network type.
   * @param provider - The Bitcoin provider.
   */
  signBtcTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: BtcTransactionRequest
    network: Network
    provider: BitcoinProvider
  }): Promise<string>

  /**
   * Signs an Avalanche transaction using the specified account, transaction request, network, and Avalanche JSON RPC provider.
   * @param accountIndex - The index of the account.
   * @param transaction - The Avalanche transaction request.
   * @param network - The network type.
   * @param provider - The Avalanche JSON RPC provider.
   */
  signAvalancheTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: AvalancheTransactionRequest
    network: Network
    provider: Avalanche.JsonRpcProvider
  }): Promise<string>

  /**
   * Signs an Ethereum Virtual Machine (EVM) transaction using the specified account, transaction request, network, and JSON RPC provider.
   * @param accountIndex - The index of the account.
   * @param transaction - The EVM transaction request.
   * @param network - The network type.
   * @param provider - The JSON RPC provider.
   */
  signEvmTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: TransactionRequest
    network: Network
    provider: JsonRpcBatchInternal
  }): Promise<string>

  /**
   * Retrieves the public key for a specific account.
   * @param path - The path of the account.
   * @param curve - The curve of the account.
   */
  getPublicKeyFor({
    derivationPath,
    curve
  }: {
    derivationPath?: string
    curve: Curve
  }): Promise<string>

  /**
   * Retrieves a read-only Avalanche signer that can be used to
   * - retrieve transaction info (e.g. utxo, nonce,...)
   * - generate transaction object (e.g. export/import tx)
   *
   * @param accountIndex - The index of the account.
   * @param provXP - The Avalanche JSON RPC provider.
   */
  getReadOnlyAvaSigner({
    accountIndex,
    provXP
  }: {
    accountIndex: number
    provXP: Avalanche.JsonRpcProvider
  }): Promise<Avalanche.WalletVoid | Avalanche.StaticSigner>

  /**
   * Signs a Solana transaction using the specified account, transaction request, network, and Solana provider.
   */
  signSvmTransaction({
    accountIndex,
    transaction,
    network,
    provider
  }: {
    accountIndex: number
    transaction: SolanaTransactionRequest
    network: Network
    provider: SolanaProvider
  }): Promise<string>
}
