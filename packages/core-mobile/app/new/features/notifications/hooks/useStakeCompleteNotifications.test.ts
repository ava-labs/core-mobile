import {
  StakeCompleteNotificationRecord,
  stakeCompleteNotificationRecordsStore
} from '../store/stakeCompleteNotificationRecords'
import {
  deriveStakeCompleteNotifications,
  STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS,
  STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS
} from './useStakeCompleteNotifications'

const DAY_MS = 24 * 60 * 60 * 1000
const NOW_MS = new Date('2026-07-16T12:00:00Z').getTime()

const record = (
  txHash: string,
  endTimestamp: number,
  { accountId = 'account-1', isDeveloperMode = false } = {}
): StakeCompleteNotificationRecord => ({
  txHash,
  endTimestamp,
  accountId,
  isDeveloperMode
})

const toMap = (
  records: StakeCompleteNotificationRecord[]
): Record<string, StakeCompleteNotificationRecord> =>
  Object.fromEntries(records.map(r => [r.txHash, r]))

describe('deriveStakeCompleteNotifications', () => {
  it('keeps only fired records inside the window, newest first', () => {
    const items = deriveStakeCompleteNotifications({
      records: toMap([
        record(
          'old',
          NOW_MS - (STAKE_COMPLETE_NOTIFICATION_WINDOW_DAYS + 1) * DAY_MS
        ),
        record('recent', NOW_MS - 2 * DAY_MS),
        record('newest', NOW_MS - 1 * DAY_MS),
        record('unfired', NOW_MS + 5 * DAY_MS) // trigger still pending
      ]),
      now: NOW_MS
    })

    expect(items.map(i => i.txHash)).toEqual(['newest', 'recent'])
    expect(items[0]?.timestamp).toBe(NOW_MS - 1 * DAY_MS)
  })

  it('caps the list at the max item count', () => {
    const records = toMap(
      Array.from({ length: 50 }, (_, i) =>
        record(`tx-${i}`, NOW_MS - (i + 1) * 3600 * 1000)
      )
    )
    const items = deriveStakeCompleteNotifications({ records, now: NOW_MS })
    expect(items).toHaveLength(STAKE_COMPLETE_NOTIFICATION_MAX_ITEMS)
    expect(items[0]?.txHash).toBe('tx-0')
  })

  it('returns empty for no records', () => {
    expect(
      deriveStakeCompleteNotifications({ records: {}, now: NOW_MS })
    ).toEqual([])
  })

  it('carries the owning account id through', () => {
    const items = deriveStakeCompleteNotifications({
      records: toMap([
        record('a', NOW_MS - DAY_MS, { accountId: 'account-42' })
      ]),
      now: NOW_MS
    })
    expect(items[0]?.accountId).toBe('account-42')
  })

  it('keeps records from both environments, tagged with their mode', () => {
    // The push scheduler notifies across mainnet AND testnet, so the list
    // spans both; tapping switches the app to the item's mode.
    const items = deriveStakeCompleteNotifications({
      records: toMap([
        record('mainnet', NOW_MS - DAY_MS),
        record('testnet', NOW_MS - 2 * DAY_MS, { isDeveloperMode: true })
      ]),
      now: NOW_MS
    })
    expect(items.map(i => [i.txHash, i.isDeveloperMode])).toEqual([
      ['mainnet', false],
      ['testnet', true]
    ])
  })
})

describe('stakeCompleteNotificationRecordsStore', () => {
  const reset = (): void =>
    stakeCompleteNotificationRecordsStore.setState({ records: {} })

  beforeEach(reset)

  it('upserts by txHash and prunes long-fired records', () => {
    const { upsert } = stakeCompleteNotificationRecordsStore.getState()
    upsert([
      record('ancient', Date.now() - 61 * DAY_MS),
      record('kept', Date.now() - DAY_MS)
    ])
    upsert([record('kept', Date.now() - DAY_MS), record('new', Date.now())])

    expect(
      Object.keys(stakeCompleteNotificationRecordsStore.getState().records)
    ).toEqual(['kept', 'new'])
  })

  it('remove deletes only the given txHashes', () => {
    const { upsert, remove } = stakeCompleteNotificationRecordsStore.getState()
    upsert([record('a', Date.now() - DAY_MS), record('b', Date.now() - DAY_MS)])
    remove(['a'])
    expect(
      Object.keys(stakeCompleteNotificationRecordsStore.getState().records)
    ).toEqual(['b'])
  })

  it('removePending drops only records that have not fired yet', () => {
    const now = Date.now()
    const { upsert, removePending } =
      stakeCompleteNotificationRecordsStore.getState()
    upsert([record('fired', now - DAY_MS), record('pending', now + DAY_MS)])
    removePending(now)
    expect(
      Object.keys(stakeCompleteNotificationRecordsStore.getState().records)
    ).toEqual(['fired'])
  })
})
