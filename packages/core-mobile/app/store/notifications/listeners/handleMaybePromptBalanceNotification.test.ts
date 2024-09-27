import { handleMaybePromptBalanceNotification } from 'store/notifications/listeners/handleMaybePromptBalanceNotification'
import NotificationsService from 'services/notifications/NotificationsService'
import * as Navigation from 'utils/Navigation'
import { ChannelId } from 'services/notifications/channels'
import AppNavigation from 'navigation/AppNavigation'
import { AppListenerEffectAPI } from 'store/index'
import { AnyAction } from '@reduxjs/toolkit'
import { selectHasBeenViewedOnce } from 'store/viewOnce/slice'
import { ViewOnceKey } from 'store/viewOnce/types'
import {
  selectHasPromptedForBalanceChange,
  selectNotificationSubscription,
  setHasPromptedForBalanceChange
} from '../slice'

jest.mock('services/notifications/NotificationsService', () => ({
  getBlockedNotifications: jest.fn()
}))

jest.mock('utils/Navigation', () => ({
  navigate: jest.fn()
}))

jest.mock('../slice', () => ({
  selectNotificationSubscription: jest.fn(() => jest.fn),
  selectHasPromptedForBalanceChange: jest.fn(),
  setHasPromptedForBalanceChange: jest.fn(() => ({ type: 'SET_HAS_PROMPTED' }))
}))

jest.mock('store/viewOnce/slice', () => ({
  selectHasBeenViewedOnce: jest.fn(),
  setViewOnce: {
    match: jest.fn()
  }
}))

jest.mock('store/viewOnce/types', () => ({
  ViewOnceKey: {
    CORE_INTRO: 'CORE_INTRO'
  }
}))

function getNotificationsPrompt(): {
  name: string
  params: { notificationChannel: ChannelId; title: string; message: string }
} {
  return {
    name: AppNavigation.Modal.EnableNotificationsPrompt,
    params: {
      notificationChannel: ChannelId.BALANCE_CHANGES,
      title: 'Turn on Notifications?',
      message:
        'You will be notified when certain wallet actions occur. You can change your preference in settings.'
    }
  }
}

describe('handleMaybePromptBalanceNotification', () => {
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

  it('should not prompt if user has already been prompted for balance changes', async () => {
    ;(selectHasPromptedForBalanceChange as jest.Mock).mockReturnValue(true)

    await handleMaybePromptBalanceNotification(action, listenerApi)

    expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })

  it('should wait for intro screen to be dismissed before prompting', async () => {
    ;(selectHasPromptedForBalanceChange as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)
    ;(selectHasBeenViewedOnce as jest.Mock).mockReturnValue(() => false)
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(new Set([ChannelId.BALANCE_CHANGES]))

    let resolveTake: (value?: unknown) => void
    const takePromise = new Promise(resolve => {
      resolveTake = resolve
    })
    ;(listenerApi.take as jest.Mock).mockReturnValue(takePromise)

    const promise = handleMaybePromptBalanceNotification(action, listenerApi)

    // verify that Navigation.navigate and listenerApi.dispatch have not been called yet
    expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()

    // simulate the intro screen being dismissed
    // @ts-ignore
    resolveTake([{ payload: ViewOnceKey.CORE_INTRO }])

    // wait for the promise to resolve
    await promise

    expect(Navigation.navigate).toHaveBeenCalledWith(getNotificationsPrompt())
    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setHasPromptedForBalanceChange(true)
    )
  })

  it('should prompt if user has not been prompted and is not subscribed to balance changes', async () => {
    const blockedNotifications = new Set()
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(blockedNotifications)
    ;(selectHasPromptedForBalanceChange as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)

    await handleMaybePromptBalanceNotification(action, listenerApi)

    expect(Navigation.navigate).toHaveBeenCalledWith(getNotificationsPrompt())

    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setHasPromptedForBalanceChange(true)
    )
  })

  it('should prompt if notifications for balance changes are blocked', async () => {
    const blockedNotifications = new Set([ChannelId.BALANCE_CHANGES])
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(blockedNotifications)
    ;(selectHasPromptedForBalanceChange as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => true)

    await handleMaybePromptBalanceNotification(action, listenerApi)

    expect(Navigation.navigate).toHaveBeenCalledWith(getNotificationsPrompt())

    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setHasPromptedForBalanceChange(true)
    )
  })

  it('should not prompt if user is already subscribed to balance changes and notifications are not blocked', async () => {
    const blockedNotifications = new Set()
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(blockedNotifications)
    ;(selectHasPromptedForBalanceChange as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => true)

    await handleMaybePromptBalanceNotification(action, listenerApi)

    expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })
})
