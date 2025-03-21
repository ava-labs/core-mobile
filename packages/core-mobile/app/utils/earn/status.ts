import { isBefore, isAfter, fromUnixTime } from 'date-fns'
import { PChainTransaction } from '@avalabs/glacier-sdk'

export const isOnGoing = (
  transaction: PChainTransaction,
  now: Date
): boolean => {
  if (!transaction.endTimestamp) return false

  const end = fromUnixTime(transaction.endTimestamp)
  return isBefore(now, end)
}

export const isCompleted = (
  transaction: PChainTransaction,
  now: Date
): boolean => {
  if (!transaction.endTimestamp) return false

  const end = fromUnixTime(transaction.endTimestamp)
  return isAfter(now, end)
}
