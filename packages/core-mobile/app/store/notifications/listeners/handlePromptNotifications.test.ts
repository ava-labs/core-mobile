import { AppListenerEffectAPI } from 'store/index'
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
    CORE_INTRO: 'CORE_INTRO',
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
    // expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })

  it('should wait for intro screen to be dismissed before prompting', async () => {
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)
    ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => false)
    let resolveTake: (value?: unknown) => void
    const takePromise = new Promise(resolve => {
      resolveTake = resolve
    })
    ;(listenerApi.take as jest.Mock).mockReturnValue(takePromise)

    const promise = handlePromptNotifications(action, listenerApi)

    // verify that Navigation.navigate and listenerApi.dispatch have not been called yet
    //expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()

    // simulate the intro screen being dismissed
    // @ts-ignore
    resolveTake([{ payload: ViewOnceKey.CORE_INTRO }])

    // wait for the promise to resolve
    await promise

    //expect(Navigation.navigate).toHaveBeenCalledWith(getNotificationsPrompt())
    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setViewOnce(ViewOnceKey.NOTIFICATIONS_PROMPT)
    )
  })
})
