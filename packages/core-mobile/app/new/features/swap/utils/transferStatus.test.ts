import type { Transfer } from '../types'
import { isTransferInProgress } from './transferStatus'

const makeTransfer = (status: Transfer['status']): Transfer =>
  ({ id: 'transfer-1', status } as Transfer)

describe('isTransferInProgress', () => {
  it('should return true for source-pending', () => {
    expect(isTransferInProgress(makeTransfer('source-pending'))).toBe(true)
  })

  it('should return true for source-completed', () => {
    expect(isTransferInProgress(makeTransfer('source-completed'))).toBe(true)
  })

  it('should return true for target-pending', () => {
    expect(isTransferInProgress(makeTransfer('target-pending'))).toBe(true)
  })

  it('should return false for completed', () => {
    expect(isTransferInProgress(makeTransfer('completed'))).toBe(false)
  })

  it('should return false for failed', () => {
    expect(isTransferInProgress(makeTransfer('failed'))).toBe(false)
  })
})
