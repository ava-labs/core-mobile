import { stakeCompleteNotificationRecordsStore } from 'features/notifications/store/stakeCompleteNotificationRecords'
import NotificationsService from 'services/notifications/NotificationsService'
import { AppListenerEffectAPI } from 'store/types'
import { handleScheduleStakingCompleteNotifications } from './handleScheduleStakingCompleteNotifications'
import { isStakeCompleteNotificationDisabled } from './utils'

jest.mock('services/notifications/NotificationsService', () => ({
  __esModule: true,
  default: { updateStakeCompleteNotification: jest.fn() }
}))

const mockIsEarnBlocked = jest.fn(() => false)
jest.mock('store/posthog', () => ({
  selectIsEarnBlocked: () => mockIsEarnBlocked()
}))

jest.mock('./utils', () => ({
  isStakeCompleteNotificationDisabled: jest.fn(async () => false)
}))

const mockUpdate =
  NotificationsService.updateStakeCompleteNotification as jest.Mock
const mockDisabled = isStakeCompleteNotificationDisabled as jest.Mock

const listenerApi = { getState: () => ({}) } as unknown as AppListenerEffectAPI

const END_TIMESTAMP_SECONDS = 1_784_000_000

describe('handleScheduleStakingCompleteNotifications', () => {
  beforeEach(() => {
    stakeCompleteNotificationRecordsStore.setState({ records: {} })
    mockIsEarnBlocked.mockReturnValue(false)
    mockDisabled.mockResolvedValue(false)
  })

  it('records scheduled notifications (seconds → ms) and schedules them', async () => {
    await handleScheduleStakingCompleteNotifications(listenerApi, [
      {
        txHash: 'tx-1',
        endTimestamp: END_TIMESTAMP_SECONDS,
        accountId: 'account-1',
        isDeveloperMode: true
      }
    ])

    expect(
      stakeCompleteNotificationRecordsStore.getState().records['tx-1']
    ).toEqual({
      txHash: 'tx-1',
      endTimestamp: END_TIMESTAMP_SECONDS * 1000,
      accountId: 'account-1',
      isDeveloperMode: true
    })
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('skips recording entries without an accountId but still schedules the batch', async () => {
    await handleScheduleStakingCompleteNotifications(listenerApi, [
      { txHash: 'no-account', endTimestamp: END_TIMESTAMP_SECONDS },
      {
        txHash: 'tx-1',
        endTimestamp: END_TIMESTAMP_SECONDS,
        accountId: 'account-1'
      }
    ])

    expect(
      Object.keys(stakeCompleteNotificationRecordsStore.getState().records)
    ).toEqual(['tx-1'])
    // The push-scheduling path still receives the full batch untouched.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ txHash: 'no-account' })
      ])
    )
  })

  it('does nothing while earn is blocked', async () => {
    mockIsEarnBlocked.mockReturnValue(true)

    await handleScheduleStakingCompleteNotifications(listenerApi, [
      {
        txHash: 'tx-1',
        endTimestamp: END_TIMESTAMP_SECONDS,
        accountId: 'account-1'
      }
    ])

    expect(stakeCompleteNotificationRecordsStore.getState().records).toEqual({})
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('does nothing while stake complete notifications are disabled', async () => {
    mockDisabled.mockResolvedValue(true)

    await handleScheduleStakingCompleteNotifications(listenerApi, [
      {
        txHash: 'tx-1',
        endTimestamp: END_TIMESTAMP_SECONDS,
        accountId: 'account-1'
      }
    ])

    expect(stakeCompleteNotificationRecordsStore.getState().records).toEqual({})
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
