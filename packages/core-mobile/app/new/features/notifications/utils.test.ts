import type { Transfer } from '@avalabs/unified-asset-transfer'
import { AppNotification, NotificationCategory, NotificationTab } from './types'
import {
  filterByTab,
  isSwapCompletedOrFailed,
  mapTransferToSourceChainStatus,
  mapTransferToSwapStatus,
  mapTransferToTargetChainStatus,
  mapTypeToCategory
} from './utils'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeNotification = (
  overrides: Partial<AppNotification> &
    Pick<AppNotification, 'type' | 'category'>
): AppNotification =>
  ({
    id: 'test-1',
    title: 'Test',
    body: 'Test body',
    timestamp: 1000,
    ...overrides
  } as AppNotification)

const makeTransfer = (status: Transfer['status']): Transfer =>
  ({
    id: 'transfer-1',
    amountIn: 1n,
    amountOut: 2n,
    status,
    environment: 'mainnet',
    fees: { gasFee: 0n, bridgeFee: 0n, partnerFee: 0n },
    fromAddress: '0x0000000000000000000000000000000000000001',
    toAddress: '0x0000000000000000000000000000000000000002',
    partnerFeeBps: null,
    type: 'CCTP',
    sourceAsset: {
      type: 'ERC20',
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18,
      address: '0x0000000000000000000000000000000000000000'
    },
    targetAsset: {
      type: 'ERC20',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      address: '0x0000000000000000000000000000000000000000'
    },
    sourceChain: { chainId: 'eip155:43114', chainName: 'Avalanche' },
    targetChain: { chainId: 'eip155:1', chainName: 'Ethereum' }
  } as unknown as Transfer)

// ─── Notification fixtures ────────────────────────────────────────────────────

const balanceChange = makeNotification({
  type: 'BALANCE_CHANGES',
  category: NotificationCategory.TRANSACTION
})

const priceAlert = makeNotification({
  id: 'test-2',
  type: 'PRICE_ALERTS',
  category: NotificationCategory.PRICE_UPDATE
})

const news = makeNotification({
  id: 'test-3',
  type: 'NEWS',
  category: NotificationCategory.NEWS
})

const allNotifications = [balanceChange, priceAlert, news]

// ─── mapTypeToCategory ────────────────────────────────────────────────────────

describe('mapTypeToCategory', () => {
  it('maps BALANCE_CHANGES to TRANSACTION', () => {
    expect(mapTypeToCategory('BALANCE_CHANGES')).toBe(
      NotificationCategory.TRANSACTION
    )
  })

  it('maps PRICE_ALERTS to PRICE_UPDATE', () => {
    expect(mapTypeToCategory('PRICE_ALERTS')).toBe(
      NotificationCategory.PRICE_UPDATE
    )
  })

  it('maps NEWS to NEWS', () => {
    expect(mapTypeToCategory('NEWS')).toBe(NotificationCategory.NEWS)
  })
})

// ─── filterByTab ──────────────────────────────────────────────────────────────

describe('filterByTab', () => {
  it('returns all notifications for ALL tab', () => {
    expect(filterByTab(allNotifications, NotificationTab.ALL)).toEqual(
      allNotifications
    )
  })

  it('returns only transactions for TRANSACTIONS tab', () => {
    const result = filterByTab(allNotifications, NotificationTab.TRANSACTIONS)
    expect(result).toEqual([balanceChange])
  })

  it('returns only price updates for PRICE_UPDATES tab', () => {
    const result = filterByTab(allNotifications, NotificationTab.PRICE_UPDATES)
    expect(result).toEqual([priceAlert])
  })

  it('returns empty array when no notifications match tab', () => {
    const result = filterByTab([news], NotificationTab.TRANSACTIONS)
    expect(result).toEqual([])
  })

  it('returns empty array when input is empty', () => {
    expect(filterByTab([], NotificationTab.ALL)).toEqual([])
  })
})

// ─── mapTransferToSwapStatus ──────────────────────────────────────────────────

describe('mapTransferToSwapStatus', () => {
  it('returns completed for status "completed"', () => {
    expect(mapTransferToSwapStatus(makeTransfer('completed'))).toBe('completed')
  })

  it('returns failed for status "failed"', () => {
    expect(mapTransferToSwapStatus(makeTransfer('failed'))).toBe('failed')
  })

  it.each([['source-pending'], ['source-completed'], ['target-pending']])(
    'returns in_progress for status "%s"',
    status => {
      expect(
        mapTransferToSwapStatus(makeTransfer(status as Transfer['status']))
      ).toBe('in_progress')
    }
  )
})

// ─── isSwapCompletedOrFailed ────────────────────────────────────────────────────────

describe('isSwapCompletedOrFailed', () => {
  it('returns true when the swap is completed', () => {
    expect(isSwapCompletedOrFailed(makeTransfer('completed'))).toBe(true)
  })

  it('returns true when the swap has failed', () => {
    expect(isSwapCompletedOrFailed(makeTransfer('failed'))).toBe(true)
  })

  it('returns false when the swap is in progress (source-pending)', () => {
    expect(isSwapCompletedOrFailed(makeTransfer('source-pending'))).toBe(false)
  })

  it('returns false when the swap is in progress (target-pending)', () => {
    expect(isSwapCompletedOrFailed(makeTransfer('target-pending'))).toBe(false)
  })

  it('returns false when the swap is in progress (source-completed)', () => {
    expect(isSwapCompletedOrFailed(makeTransfer('source-completed'))).toBe(
      false
    )
  })
})

// ─── mapTransferToSourceChainStatus ──────────────────────────────────────────

describe('mapTransferToSourceChainStatus', () => {
  it('returns failed for status "failed"', () => {
    expect(mapTransferToSourceChainStatus(makeTransfer('failed'))).toBe(
      'failed'
    )
  })

  it('returns in_progress for source-pending', () => {
    expect(mapTransferToSourceChainStatus(makeTransfer('source-pending'))).toBe(
      'in_progress'
    )
  })

  it.each([['source-completed'], ['target-pending'], ['completed']])(
    'returns completed for status "%s" (source is done)',
    status => {
      expect(
        mapTransferToSourceChainStatus(
          makeTransfer(status as Transfer['status'])
        )
      ).toBe('completed')
    }
  )
})

// ─── mapTransferToTargetChainStatus ──────────────────────────────────────────

describe('mapTransferToTargetChainStatus', () => {
  it('returns failed for status "failed"', () => {
    expect(mapTransferToTargetChainStatus(makeTransfer('failed'))).toBe(
      'failed'
    )
  })

  it('returns completed for status "completed"', () => {
    expect(mapTransferToTargetChainStatus(makeTransfer('completed'))).toBe(
      'completed'
    )
  })

  it.each([['source-pending'], ['source-completed'], ['target-pending']])(
    'returns in_progress for status "%s" (target not yet done)',
    status => {
      expect(
        mapTransferToTargetChainStatus(
          makeTransfer(status as Transfer['status'])
        )
      ).toBe('in_progress')
    }
  )
})
