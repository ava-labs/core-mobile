import type {
  CompletedTransfer,
  FailedTransfer,
  RefundedTransfer
} from '@avalabs/fusion-sdk'
import type { Transfer } from '../types'

export const isCompletedTransfer = (
  transfer: Transfer
): transfer is CompletedTransfer => transfer.status === 'completed'

export const isFailedTransfer = (
  transfer: Transfer
): transfer is FailedTransfer => transfer.status === 'failed'

export const isRefundedTransfer = (
  transfer: Transfer
): transfer is RefundedTransfer => transfer.status === 'refunded'

export const isConcludedTransfer = (
  transfer: Transfer
): transfer is CompletedTransfer | FailedTransfer | RefundedTransfer =>
  isCompletedTransfer(transfer) ||
  isFailedTransfer(transfer) ||
  isRefundedTransfer(transfer)
