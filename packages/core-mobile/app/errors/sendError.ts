export enum SendErrorMessage {
  AMOUNT_REQUIRED = 'Amount required',
  ADDRESS_REQUIRED = 'Address required',
  INVALID_ADDRESS = 'Address is invalid',
  INVALID_NETWORK_FEE = 'Network Fee is invalid',
  BALANCE_NOT_FOUND = 'Unable to fetch balance',
  INSUFFICIENT_BALANCE = 'Insufficient balance',
  INSUFFICIENT_BALANCE_FOR_FEE = 'Insufficient balance for fee',
  TOKEN_REQUIRED = 'Token is required',
  UNSUPPORTED_TOKEN = 'Unsupported token',
  INVALID_GAS_LIMIT = 'Unable to send token - invalid gas limit',
  UNKNOWN_ERROR = 'Unknown error',
  EXCESSIVE_NETWORK_FEE = 'Selected fee is too high',
  AMOUNT_TOO_LOW = 'Amount is too low'
}
