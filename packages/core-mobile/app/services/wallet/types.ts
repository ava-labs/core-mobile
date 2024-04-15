import { TransactionRequest } from 'ethers'
import {
  Avalanche,
  BitcoinInputUTXO,
  BitcoinOutputUTXO,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/wallets-sdk'
import { UnsignedTx } from '@avalabs/avalanchejs'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { Avax } from 'types/Avax'
import { RpcMethod } from 'store/rpc/types'

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
  shouldValidateBurnedAmount?: boolean
}

export interface CommonAvalancheTxParamsBase {
  accountIndex: number
  avaxXPNetwork: Network
  destinationAddress: string | undefined
  shouldValidateBurnedAmount?: boolean
}

export type CreateExportCTxParams = CommonAvalancheTxParamsBase & {
  amount: Avax
  baseFee: Avax
  destinationChain: 'P' | 'X'
}

export type CreateImportPTxParams = CommonAvalancheTxParamsBase & {
  sourceChain: 'C' | 'X'
}

export type CreateExportPTxParams = CommonAvalancheTxParamsBase & {
  amount: bigint
  destinationChain: 'C' | 'X'
}

export type CreateImportCTxParams = CommonAvalancheTxParamsBase & {
  baseFee: Avax
  sourceChain: 'P' | 'X'
}

export enum WalletType {
  UNSET = 'UNSET',
  SEEDLESS = 'SEEDLESS',
  MNEMONIC = 'MNEMONIC'
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
    accountIndex: number
    network: Network
    provider: JsonRpcBatchInternal
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
   * @param accountIndex - The index of the account.
   */
  getPublicKey(accountIndex: number): Promise<PubKeyType>

  /**
   * Retrieves addresses for a specific account on various networks.
   * @param accountIndex - The index of the account.
   * @param isTestnet - A boolean indicating whether the network is a testnet.
   * @param provXP - The Avalanche JSON RPC provider.
   */
  getAddresses({
    accountIndex,
    isTestnet,
    provXP
  }: {
    accountIndex: number
    isTestnet: boolean
    provXP: Avalanche.JsonRpcProvider
  }): Record<NetworkVMType, string>

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
  }): Avalanche.WalletVoid | Avalanche.StaticSigner
}
