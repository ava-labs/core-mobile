import type { Transfer } from '../types'

export function isTransferInProgress(transfer: Transfer): boolean {
  return (
    transfer.status === 'source-pending' ||
    transfer.status === 'source-completed' ||
    transfer.status === 'target-pending'
  )
}
