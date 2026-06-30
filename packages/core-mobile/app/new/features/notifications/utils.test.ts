import type { Transfer } from '@avalabs/fusion-sdk'
import {
  AppNotification,
  NotificationCategory,
  NotificationSwapStatus,
  NotificationTab
} from './types'
import {
  buildAccountLabelMap,
  filterByTab,
  isSwapTerminal,
  isTerminalRecurringSwapNotification,
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

// ─── buildAccountLabelMap ─────────────────────────────────────────────────────

describe('buildAccountLabelMap', () => {
  const addr = '0x1111111111111111111111111111111111111111'
  const otherAddr = '0x2222222222222222222222222222222222222222'

  const makeAccounts = (
    entries: { id: string; addressC: string; name: string; walletId: string }[]
  ): Parameters<typeof buildAccountLabelMap>[0] =>
    Object.fromEntries(
      entries.map(e => [
        e.id,
        {
          id: e.id,
          addressC: e.addressC,
          name: e.name,
          walletId: e.walletId,
          addressBTC: '',
          index: 0
        }
      ])
    ) as Parameters<typeof buildAccountLabelMap>[0]

  const makeWallets = (
    entries: { id: string; name: string }[]
  ): Parameters<typeof buildAccountLabelMap>[1] =>
    Object.fromEntries(
      entries.map(e => [e.id, { id: e.id, name: e.name, type: 'MNEMONIC' }])
    ) as Parameters<typeof buildAccountLabelMap>[1]

  it('uses just the account name when the user has one wallet', () => {
    const accounts = makeAccounts([
      { id: 'a1', addressC: addr, name: 'Account 2', walletId: 'w1' }
    ])
    const wallets = makeWallets([{ id: 'w1', name: 'Wallet A' }])

    expect(buildAccountLabelMap(accounts, wallets).get(addr)).toBe('Account 2')
  })

  it('prefixes the wallet name when the user has multiple wallets', () => {
    const accounts = makeAccounts([
      { id: 'a1', addressC: addr, name: 'Account 2', walletId: 'w2' }
    ])
    const wallets = makeWallets([
      { id: 'w1', name: 'Wallet A' },
      { id: 'w2', name: 'Wallet B' }
    ])

    expect(buildAccountLabelMap(accounts, wallets).get(addr)).toBe(
      'Wallet B · Account 2'
    )
  })

  it('keys the map by lowercased address regardless of input casing', () => {
    const accounts = makeAccounts([
      {
        id: 'a1',
        addressC: addr.toUpperCase(),
        name: 'Account 2',
        walletId: 'w1'
      }
    ])
    const wallets = makeWallets([{ id: 'w1', name: 'Wallet A' }])

    const map = buildAccountLabelMap(accounts, wallets)
    expect(map.get(addr)).toBe('Account 2')
    expect(map.get(addr.toUpperCase())).toBeUndefined()
  })

  it('omits addresses for accounts the user does not own', () => {
    const accounts = makeAccounts([
      { id: 'a1', addressC: addr, name: 'Account 1', walletId: 'w1' }
    ])
    const wallets = makeWallets([{ id: 'w1', name: 'Wallet A' }])

    expect(
      buildAccountLabelMap(accounts, wallets).get(otherAddr)
    ).toBeUndefined()
  })

  it('returns an empty map when there are no accounts', () => {
    expect(buildAccountLabelMap({}, {}).size).toBe(0)
  })

  it('lets the active account win when an address collides across wallets', () => {
    // e.g. a private-key wallet imports a key already derived in a mnemonic
    // wallet — both accounts legitimately own the same EVM address.
    const accounts = makeAccounts([
      {
        id: 'mnemonic-acct',
        addressC: addr,
        name: 'Account 5',
        walletId: 'w1'
      },
      {
        id: 'private-key-acct',
        addressC: addr,
        name: 'Imported',
        walletId: 'w2'
      }
    ])
    const wallets = makeWallets([
      { id: 'w1', name: 'Mnemonic Wallet' },
      { id: 'w2', name: 'Private Key Wallet' }
    ])

    expect(
      buildAccountLabelMap(accounts, wallets, 'private-key-acct').get(addr)
    ).toBe('Private Key Wallet · Imported')

    expect(
      buildAccountLabelMap(accounts, wallets, 'mnemonic-acct').get(addr)
    ).toBe('Mnemonic Wallet · Account 5')
  })
})

// ─── mapTransferToSwapStatus ──────────────────────────────────────────────────

describe('mapTransferToSwapStatus', () => {
  it('returns completed for status "completed"', () => {
    expect(mapTransferToSwapStatus(makeTransfer('completed'))).toBe(
      NotificationSwapStatus.Completed
    )
  })

  it('returns failed for status "failed"', () => {
    expect(mapTransferToSwapStatus(makeTransfer('failed'))).toBe(
      NotificationSwapStatus.Failed
    )
  })

  it('returns refunded for status "refunded"', () => {
    expect(mapTransferToSwapStatus(makeTransfer('refunded'))).toBe(
      NotificationSwapStatus.Refunded
    )
  })

  it.each([['source-pending'], ['source-completed'], ['target-pending']])(
    'returns in_progress for status "%s"',
    status => {
      expect(
        mapTransferToSwapStatus(makeTransfer(status as Transfer['status']))
      ).toBe(NotificationSwapStatus.InProgress)
    }
  )
})

// ─── isSwapTerminal ────────────────────────────────────────────────────────

describe('isSwapTerminal', () => {
  it('returns true when the swap is completed', () => {
    expect(isSwapTerminal(makeTransfer('completed'))).toBe(true)
  })

  it('returns true when the swap has failed', () => {
    expect(isSwapTerminal(makeTransfer('failed'))).toBe(true)
  })

  it('returns true when the swap was refunded (partial failure)', () => {
    expect(isSwapTerminal(makeTransfer('refunded'))).toBe(true)
  })

  it('returns false when the swap is in progress (source-pending)', () => {
    expect(isSwapTerminal(makeTransfer('source-pending'))).toBe(false)
  })

  it('returns false when the swap is in progress (target-pending)', () => {
    expect(isSwapTerminal(makeTransfer('target-pending'))).toBe(false)
  })

  it('returns false when the swap is in progress (source-completed)', () => {
    expect(isSwapTerminal(makeTransfer('source-completed'))).toBe(false)
  })
})

// ─── mapTransferToSourceChainStatus ──────────────────────────────────────────

describe('mapTransferToSourceChainStatus', () => {
  it('returns failed for status "failed"', () => {
    expect(mapTransferToSourceChainStatus(makeTransfer('failed'))).toBe(
      NotificationSwapStatus.Failed
    )
  })

  it('returns in_progress for source-pending', () => {
    expect(mapTransferToSourceChainStatus(makeTransfer('source-pending'))).toBe(
      NotificationSwapStatus.InProgress
    )
  })

  it('returns completed for status "refunded" (source transaction succeeded)', () => {
    expect(mapTransferToSourceChainStatus(makeTransfer('refunded'))).toBe(
      NotificationSwapStatus.Completed
    )
  })

  it.each([['source-completed'], ['target-pending'], ['completed']])(
    'returns completed for status "%s" (source is done)',
    status => {
      expect(
        mapTransferToSourceChainStatus(
          makeTransfer(status as Transfer['status'])
        )
      ).toBe(NotificationSwapStatus.Completed)
    }
  )
})

// ─── mapTransferToTargetChainStatus ──────────────────────────────────────────

describe('mapTransferToTargetChainStatus', () => {
  it('returns failed for status "failed"', () => {
    expect(mapTransferToTargetChainStatus(makeTransfer('failed'))).toBe(
      NotificationSwapStatus.Failed
    )
  })

  it('returns completed for status "completed"', () => {
    expect(mapTransferToTargetChainStatus(makeTransfer('completed'))).toBe(
      NotificationSwapStatus.Completed
    )
  })

  it('returns incomplete for status "refunded" (target did not complete)', () => {
    expect(mapTransferToTargetChainStatus(makeTransfer('refunded'))).toBe(
      NotificationSwapStatus.Incomplete
    )
  })

  it.each([['source-pending'], ['source-completed'], ['target-pending']])(
    'returns in_progress for status "%s" (target not yet done)',
    status => {
      expect(
        mapTransferToTargetChainStatus(
          makeTransfer(status as Transfer['status'])
        )
      ).toBe(NotificationSwapStatus.InProgress)
    }
  )
})

// ─── isTerminalRecurringSwapNotification ──────────────────────────────────────

const makeRecurringNotification = (
  data?: Partial<{
    status: string
    numberOfOrders: number
    executedOrders: number
    remainingOrders: number
  }>
): AppNotification =>
  makeNotification({
    type: 'RECURRING_SWAP',
    category: NotificationCategory.TRANSACTION,
    ...(data
      ? {
          data: {
            orderId: '0xorder',
            owner: '0xowner',
            chainId: 43114,
            tokenIn: '0xin',
            tokenOut: '0xout',
            amountIn: '1',
            amountOut: '2',
            status: 'active',
            numberOfOrders: 5,
            executedOrders: 1,
            remainingOrders: 4,
            ...data
          }
        }
      : {})
  } as Partial<AppNotification> & Pick<AppNotification, 'type' | 'category'>)

describe('isTerminalRecurringSwapNotification', () => {
  it('returns false for a non-recurring notification', () => {
    expect(isTerminalRecurringSwapNotification(balanceChange)).toBe(false)
  })

  it('returns false for a recurring notification without a data payload', () => {
    expect(
      isTerminalRecurringSwapNotification(makeRecurringNotification())
    ).toBe(false)
  })

  it.each([['active'], ['paused'], ['executed']])(
    'returns false for an ongoing fill (status "%s", fills remaining)',
    status => {
      expect(
        isTerminalRecurringSwapNotification(
          makeRecurringNotification({ status, remainingOrders: 3 })
        )
      ).toBe(false)
    }
  )

  it.each([['completed'], ['cancelled'], ['failed']])(
    'returns true for terminal status "%s"',
    status => {
      expect(
        isTerminalRecurringSwapNotification(
          makeRecurringNotification({ status, remainingOrders: 2 })
        )
      ).toBe(true)
    }
  )

  it('returns true for the final leg of a finite schedule (no fills remain)', () => {
    expect(
      isTerminalRecurringSwapNotification(
        makeRecurringNotification({
          status: 'active',
          numberOfOrders: 3,
          executedOrders: 3,
          remainingOrders: 0
        })
      )
    ).toBe(true)
  })

  it('returns false for an infinite/DCA schedule even with remainingOrders 0', () => {
    // numberOfOrders === -1 never reaches a "no fills remain" terminal.
    expect(
      isTerminalRecurringSwapNotification(
        makeRecurringNotification({
          status: 'active',
          numberOfOrders: -1,
          remainingOrders: 0
        })
      )
    ).toBe(false)
  })
})
