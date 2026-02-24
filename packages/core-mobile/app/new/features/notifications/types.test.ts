import {
  AppNotification,
  NotificationCategory,
  NotificationTab,
  filterByTab,
  mapTypeToCategory,
  isPriceAlertNotification,
  isBalanceChangeNotification
} from './types'

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

describe('isPriceAlertNotification', () => {
  it('returns true for PRICE_ALERTS type', () => {
    expect(isPriceAlertNotification(priceAlert)).toBe(true)
  })

  it('returns false for other types', () => {
    expect(isPriceAlertNotification(balanceChange)).toBe(false)
    expect(isPriceAlertNotification(news)).toBe(false)
  })
})

describe('isBalanceChangeNotification', () => {
  it('returns true for BALANCE_CHANGES type', () => {
    expect(isBalanceChangeNotification(balanceChange)).toBe(true)
  })

  it('returns false for other types', () => {
    expect(isBalanceChangeNotification(priceAlert)).toBe(false)
    expect(isBalanceChangeNotification(news)).toBe(false)
  })
})
