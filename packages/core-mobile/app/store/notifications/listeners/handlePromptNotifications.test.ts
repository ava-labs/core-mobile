import { AppListenerEffectAPI } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce } from 'store/viewOnce/slice'
import { handlePromptNotifications } from './handlePromptNotifications'

jest.mock('services/notifications/NotificationsService', () => ({
  getBlockedNotifications: jest.fn(),
  getNotificationSettings: jest.fn()
}))

jest.mock('../slice', () => ({
  selectNotificationSubscription: jest.fn(() => jest.fn)
}))

jest.mock('store/posthog/slice', () => {
  const actual = jest.requireActual('store/posthog/slice')
  return {
    ...actual,
    selectIsEnableNotificationPromptBlocked: jest.fn()
  }
})

describe('handlePromptNotifications', () => {
  let listenerApi: AppListenerEffectAPI
  let action: AnyAction

  beforeEach(() => {
    listenerApi = {
      getState: jest.fn(),
      dispatch: jest.fn(),
      take: jest.fn()
    } as unknown as AppListenerEffectAPI
    action = {
      type: 'SOME_ACTION'
    }
    jest.clearAllMocks()
    ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => true)
  })

  it('should not prompt if user has already been prompted for notifications', async () => {
    ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => true)
    await handlePromptNotifications(action, listenerApi)
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })
})
