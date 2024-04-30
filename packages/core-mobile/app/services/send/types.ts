import BN from 'bn.js'
import { TokenWithBalance } from 'store/balance'
import { SignTransactionRequest } from 'services/wallet/types'
import { Transaction } from '@sentry/types'
import { Dispatch } from '@reduxjs/toolkit'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account/types'
import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { Request } from 'store/rpc/types'
import { AvalancheTxParams } from 'store/rpc/handlers/avalanche_sendTransaction/avalanche_sendTransaction'

export interface SendError {
  error: boolean
  message: string
}

export interface SendState<T extends TokenWithBalance = TokenWithBalance> {
  maxAmount?: BN
  amount?: BN
  address?: string
  error?: SendError
  sendFee?: BN
  defaultMaxFeePerGas?: bigint // should be the lowest network fee
  gasLimit?: number
  canSubmit?: boolean
  token?: T
  txId?: string
}

export type ValidSendState = SendState &
  Required<Pick<SendState, 'amount' | 'address' | 'defaultMaxFeePerGas'>> & {
    canSubmit: true
  }

export function isValidSendState(
  sendState: SendState
): sendState is ValidSendState {
  return sendState.canSubmit === true
}

export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  INSUFFICIENT_BALANCE = 'Insufficient balance.',
  INSUFFICIENT_BALANCE_FOR_FEE = 'Insufficient balance for fee.'
}

export interface SendServiceHelper {
  getTransactionRequest(
    params: GetTransactionRequestParams
  ): Promise<SignTransactionRequest | AvalancheTxParams>
  validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState>
}

export type GetTransactionRequestParams = SendServiceFuncParams

export type ValidateStateAndCalculateFeesParams = SendServiceFuncParams & {
  nativeTokenBalance?: BN // in wei
}

export type GetPVMTransactionRequestParams = SendServiceFuncParams & {
  accountIndex: number
}

export type SendParams = {
  sendState: SendState
  network: Network
  account: Account
  currency: string
  signAndSend: (txParams: [TransactionParams]) => Promise<string>
  sentryTrx?: Transaction
  dispatch?: Dispatch<{ payload: Request; type: string }>
}

type SendServiceFuncParams = {
  sendState: SendState
  isMainnet: boolean
  fromAddress: string
  currency?: string
  sentryTrx?: Transaction
}
