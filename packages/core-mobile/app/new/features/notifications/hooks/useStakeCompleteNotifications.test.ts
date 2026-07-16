import {
  deriveStakeCompleteNotifications,
  STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS,
  STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS
} from './useStakeCompleteNotifications'

const DAY_S = 24 * 60 * 60
const NOW_MS = new Date('2026-07-16T12:00:00Z').getTime()
const NOW_S = NOW_MS / 1000

const stake = (
  txHash: string,
  endTimestamp: number | undefined,
  accountId = 'account-1'
): {
  txHash: string
  endTimestamp: number | undefined
  accountId: string
  isOnGoing: boolean
} => ({
  txHash,
  endTimestamp,
  accountId,
  isOnGoing: endTimestamp !== undefined && endTimestamp > NOW_S
})

describe('deriveStakeCompleteNotifications', () => {
  it('keeps only stakes completed inside the window, newest first, in ms', () => {
    const items = deriveStakeCompleteNotifications({
      stakes: [
        stake(
          'old',
          NOW_S - (STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS + 1) * DAY_S
        ),
        stake('recent', NOW_S - 2 * DAY_S),
        stake('newest', NOW_S - 1 * DAY_S),
        stake('future', NOW_S + 5 * DAY_S), // still active
        stake('missing-end', undefined)
      ],
      dismissedTxHashes: {},
      now: NOW_MS
    })

    expect(items.map(i => i.txHash)).toEqual(['newest', 'recent'])
    expect(items[0]?.timestamp).toBe((NOW_S - 1 * DAY_S) * 1000)
  })

  it('filters out dismissed stakes', () => {
    const items = deriveStakeCompleteNotifications({
      stakes: [stake('a', NOW_S - DAY_S), stake('b', NOW_S - 2 * DAY_S)],
      dismissedTxHashes: { a: (NOW_S - DAY_S) * 1000 },
      now: NOW_MS
    })
    expect(items.map(i => i.txHash)).toEqual(['b'])
  })

  it('caps the list at the max item count', () => {
    const stakes = Array.from({ length: 50 }, (_, i) =>
      stake(`tx-${i}`, NOW_S - (i + 1) * 3600)
    )
    const items = deriveStakeCompleteNotifications({
      stakes,
      dismissedTxHashes: {},
      now: NOW_MS
    })
    expect(items).toHaveLength(STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS)
    expect(items[0]?.txHash).toBe('tx-0')
  })

  it('returns empty for undefined stakes', () => {
    expect(
      deriveStakeCompleteNotifications({
        stakes: undefined,
        dismissedTxHashes: {},
        now: NOW_MS
      })
    ).toEqual([])
  })

  it('carries the owning account id through', () => {
    const items = deriveStakeCompleteNotifications({
      stakes: [stake('a', NOW_S - DAY_S, 'account-42')],
      dismissedTxHashes: {},
      now: NOW_MS
    })
    expect(items[0]?.accountId).toBe('account-42')
  })
})
