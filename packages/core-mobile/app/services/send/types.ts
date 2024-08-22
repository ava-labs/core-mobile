import { SignTransactionRequest } from 'services/wallet/types'
import { Transaction } from '@sentry/types'
import { Network } from '@avalabs/core-chains-sdk'
import { Account } from 'store/account/types'
import { Request } from 'store/rpc/utils/createInAppRequest'
import { TokenWithBalance } from '@avalabs/vm-module-types'
import { AvalancheSendTransactionParams } from '@avalabs/avalanche-module'

export interface SendError {
  error: boolean
  message: string
}

export interface SendState<T extends TokenWithBalance = TokenWithBalance> {
  maxAmount?: bigint
  amount?: bigint
  address?: string
  error?: SendError
  sendFee?: bigint
  defaultMaxFeePerGas?: bigint // should be the lowest network fee
  gasLimit?: number
  canSubmit?: boolean
  token?: T
  txId?: string
}

export function isValidSendState(sendState: SendState): boolean {
  return sendState.canSubmit === true
}

export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  INSUFFICIENT_BALANCE = 'Insufficient balance.',
  INSUFFICIENT_BALANCE_FOR_FEE = 'Insufficient balance for fee.',
  INVALID_GAS_LIMIT = 'Gas limit is invalid'
}

export interface SendServiceHelper {
  getTransactionRequest(
    params: GetTransactionRequestParams
  ): Promise<SignTransactionRequest | AvalancheSendTransactionParams>
  validateStateAndCalculateFees(
    params: ValidateStateAndCalculateFeesParams
  ): Promise<SendState>
}

export type GetTransactionRequestParams = SendServiceFuncParams

export type ValidateStateAndCalculateFeesParams = SendServiceFuncParams & {
  nativeTokenBalance?: bigint // in wei
}

export type GetPVMTransactionRequestParams = SendServiceFuncParams & {
  accountIndex: number
}

export type SendParams = {
  sendState: SendState
  network: Network
  account: Account
  currency: string
  request: Request
  sentryTrx?: Transaction
}

type SendServiceFuncParams = {
  sendState: SendState
  isMainnet: boolean
  fromAddress: string
  currency?: string
  sentryTrx?: Transaction
}
