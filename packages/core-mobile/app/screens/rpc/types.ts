export type TransactionProgressData = {
  hash?: string
  error?: string
  transactionState: TransactionProgressState
}

export enum TransactionProgressState {
  NOT_APPROVED = 'TRANSACTION_NOT_APPROVED',
  PENDING = 'TRANSACTION_PENDING',
  SUCCESS = 'TRANSACTION_SUCCESS',
  ERROR = 'TRANSACTION_ERROR'
}
