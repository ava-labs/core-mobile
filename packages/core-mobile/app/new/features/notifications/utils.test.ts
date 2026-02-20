import {
  AppNotification,
  NotificationCategory,
  NotificationTab,
  SwapActivityItem,
  SwapTransfer
} from './types'
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

const makeTransfer = (status: SwapTransfer['status']): SwapTransfer =>
  ({
    id: 'transfer-1',
    amountIn: '1',
    amountOut: '2',
    status,
    sourceAsset: {
      type: 'ERC20',
      symbol: 'AVAX',
      name: 'Avalanche',
      decimals: 18
    },
    targetAsset: {
      type: 'ERC20',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6
    },
    sourceChain: { chainId: 'eip155:43114', chainName: 'Avalanche' },
    targetChain: { chainId: 'eip155:1', chainName: 'Ethereum' }
  } as SwapTransfer)

const makeSwapItem = (status: SwapTransfer['status']): SwapActivityItem => ({
  transfer: makeTransfer(status),
  fromTokenId: 'NATIVE-AVAX',
  toTokenId: 'ERC20-USDC',
  timestamp: Date.now()
})

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
  it.each([['completed'], ['target-confirmed']])(
    'returns completed for status "%s"',
    status => {
      expect(mapTransferToSwapStatus(makeTransfer(status))).toBe('completed')
    }
  )

  it.each([['failed'], ['error'], ['source-failed'], ['target-failed']])(
    'returns failed for status "%s"',
    status => {
      expect(mapTransferToSwapStatus(makeTransfer(status))).toBe('failed')
    }
  )

  it('is case-insensitive (FAILED → failed)', () => {
    expect(mapTransferToSwapStatus(makeTransfer('FAILED'))).toBe('failed')
  })

  it.each([['source-pending'], ['source-confirmed'], ['target-pending']])(
    'returns in_progress for status "%s"',
    status => {
      expect(mapTransferToSwapStatus(makeTransfer(status))).toBe('in_progress')
    }
  )
})

// ─── isSwapCompletedOrFailed ────────────────────────────────────────────────────────

describe('isSwapCompletedOrFailed', () => {
  it('returns true when the swap is completed', () => {
    expect(isSwapCompletedOrFailed(makeSwapItem('completed'))).toBe(true)
  })

  it('returns true when the swap has failed', () => {
    expect(isSwapCompletedOrFailed(makeSwapItem('failed'))).toBe(true)
  })

  it('returns false when the swap is in progress (source-pending)', () => {
    expect(isSwapCompletedOrFailed(makeSwapItem('source-pending'))).toBe(false)
  })

  it('returns false when the swap is in progress (target-pending)', () => {
    expect(isSwapCompletedOrFailed(makeSwapItem('target-pending'))).toBe(false)
  })

  it('returns false when the swap is in progress (source-confirmed)', () => {
    expect(isSwapCompletedOrFailed(makeSwapItem('source-confirmed'))).toBe(
      false
    )
  })
})

// ─── mapTransferToSourceChainStatus ──────────────────────────────────────────

describe('mapTransferToSourceChainStatus', () => {
  it.each([['source-failed'], ['failed'], ['error']])(
    'returns failed for status "%s"',
    status => {
      expect(mapTransferToSourceChainStatus(makeTransfer(status))).toBe(
        'failed'
      )
    }
  )

  it('returns in_progress for source-pending', () => {
    expect(mapTransferToSourceChainStatus(makeTransfer('source-pending'))).toBe(
      'in_progress'
    )
  })

  it.each([
    ['source-confirmed'],
    ['target-pending'],
    ['target-confirmed'],
    ['completed']
  ])('returns completed for status "%s" (source is done)', status => {
    expect(mapTransferToSourceChainStatus(makeTransfer(status))).toBe(
      'completed'
    )
  })
})

// ─── mapTransferToTargetChainStatus ──────────────────────────────────────────

describe('mapTransferToTargetChainStatus', () => {
  it.each([['target-failed'], ['failed'], ['error'], ['source-failed']])(
    'returns failed for status "%s"',
    status => {
      expect(mapTransferToTargetChainStatus(makeTransfer(status))).toBe(
        'failed'
      )
    }
  )

  it.each([['completed'], ['target-confirmed']])(
    'returns completed for status "%s"',
    status => {
      expect(mapTransferToTargetChainStatus(makeTransfer(status))).toBe(
        'completed'
      )
    }
  )

  it.each([['source-pending'], ['source-confirmed'], ['target-pending']])(
    'returns in_progress for status "%s" (target not yet done)',
    status => {
      expect(mapTransferToTargetChainStatus(makeTransfer(status))).toBe(
        'in_progress'
      )
    }
  )
})
