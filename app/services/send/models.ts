import BN from 'bn.js';
import { BigNumber } from 'ethers';
import { TokenWithBalance } from '../balances/models';
import { SignTransactionRequest } from '../wallet/models';

export enum SendEvent {
  TX_DETAILS = 'SendEvent: TX_DETAILS',
}

export interface SendError {
  error: boolean;
  message: string;
}

export const DEFAULT_SEND_HOOK_ERROR: SendError = {
  error: false,
  message: '',
};

export interface SendState<T extends TokenWithBalance = TokenWithBalance> {
  maxAmount?: BN;
  amount?: BN;
  address?: string;
  error?: SendError;
  sendFee?: BN;
  gasPrice?: BigNumber;
  gasLimit?: number;
  canSubmit?: boolean;
  loading?: boolean;
  token?: T;
  txId?: string;
}

export type ValidSendState = SendState &
  Required<Pick<SendState, 'amount' | 'address' | 'gasPrice'>> & {
    canSubmit: true;
  };

export function isValidSendState(
  sendState: SendState
): sendState is ValidSendState {
  return sendState.canSubmit === true;
}

export interface SendErrors {
  amountError: SendError;
  addressError: SendError;
  formError: SendError;
}

export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  C_CHAIN_REQUIRED = 'Must be a C chain address',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  INSUFFICIENT_BALANCE = 'Insufficient balance.',
}

export interface SendServiceHelper {
  getTransactionRequest(sendState: SendState): Promise<SignTransactionRequest>;
  validateStateAndCalculateFees(sendState: SendState): Promise<SendState>;
}
