import type { Transfer } from '../types'
import { isConcludedTransfer } from './transferStatus'

const makeTransfer = (status: Transfer['status']): Transfer =>
  ({ id: 'transfer-1', status } as Transfer)

describe('isConcludedTransfer', () => {
  it('should return false for source-pending', () => {
    expect(isConcludedTransfer(makeTransfer('source-pending'))).toBe(false)
  })

  it('should return false for source-completed', () => {
    expect(isConcludedTransfer(makeTransfer('source-completed'))).toBe(false)
  })

  it('should return false for target-pending', () => {
    expect(isConcludedTransfer(makeTransfer('target-pending'))).toBe(false)
  })

  it('should return true for completed', () => {
    expect(isConcludedTransfer(makeTransfer('completed'))).toBe(true)
  })

  it('should return true for failed', () => {
    expect(isConcludedTransfer(makeTransfer('failed'))).toBe(true)
  })

  it('should return true for refunded', () => {
    expect(isConcludedTransfer(makeTransfer('refunded'))).toBe(true)
  })
})
