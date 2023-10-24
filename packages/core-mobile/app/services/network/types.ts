export interface TransactionError extends Error {
  transactionHash: string
}
