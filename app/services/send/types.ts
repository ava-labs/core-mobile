import { TokenWithBalance } from 'store/balance'
import { BN } from 'avalanche'
import { BigNumber } from 'ethers'
import { SignTransactionRequest } from 'services/wallet/types'

export interface SendState<T = TokenWithBalance> {
  maxAmount?: BN
  amount?: BN
  address?: string
  error?: SendError
  sendFee?: BN
  gasPrice?: BigNumber
  gasLimit?: number
  canSubmit?: boolean
  token?: T
  txId?: string
}

export type ValidSendState = SendState &
  Required<Pick<SendState, 'amount' | 'address' | 'gasPrice'>> & {
    canSubmit: true
  }

export interface SendError {
  error: boolean
  message: string
}

export interface SendServiceHelper {
  getTransactionRequest(sendState: SendState): Promise<SignTransactionRequest>
  validateStateAndCalculateFees(sendState: SendState): Promise<SendState>
}

export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  C_CHAIN_REQUIRED = 'Must be a C chain address',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  INSUFFICIENT_BALANCE = 'Insufficient balance.'
}
