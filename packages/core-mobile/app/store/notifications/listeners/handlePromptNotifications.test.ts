import { AppListenerEffectAPI } from 'store/types'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce, setViewOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import { selectNotificationSubscription } from '../slice'
import { handlePromptNotifications } from './handlePromptNotifications'

jest.mock('services/notifications/NotificationsService', () => ({
  getBlockedNotifications: jest.fn(),
  getNotificationSettings: jest.fn()
}))

jest.mock('../slice', () => ({
  selectNotificationSubscription: jest.fn(() => jest.fn)
}))

jest.mock('store/viewOnce/slice', () => ({
  selectHasBeenViewedOnce: jest.fn(),
  setViewOnce: jest.fn()
}))

jest.mock('store/viewOnce/types', () => ({
  ViewOnceKey: {
    NOTIFICATIONS_PROMPT: 'NOTIFICATIONS_PROMPT'
  }
}))

jest.mock('store/posthog/slice', () => {
  const actual = jest.requireActual('store/posthog/slice')
  return {
    ...actual,
    selectIsEnableNotificationPromptBlocked: jest.fn()
  }
})

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('handlePromptNotifications', () => {
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

  it('should wait for intro screen to be dismissed before prompting', async () => {
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)
    ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => false)

    const promise = handlePromptNotifications(action, listenerApi)

    // verify listenerApi.dispatch have not been called yet
    expect(listenerApi.dispatch).not.toHaveBeenCalled()

    // wait for the promise to resolve
    await promise

    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT)
    )
  })
})
