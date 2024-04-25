import BN from 'bn.js'
import { TokenWithBalance } from 'store/balance'
import { SignTransactionRequest } from 'services/wallet/types'
import { Transaction } from '@sentry/types'

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
  ): Promise<SignTransactionRequest>
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

type SendServiceFuncParams = {
  sendState: SendState
  isMainnet: boolean
  fromAddress: string
  currency?: string
  sentryTrx?: Transaction
}
