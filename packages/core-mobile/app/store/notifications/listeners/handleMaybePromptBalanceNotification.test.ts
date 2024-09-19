import { handleMaybePromptBalanceNotification } from 'store/notifications/listeners/handleMaybePromptBalanceNotification'
import NotificationsService from 'services/notifications/NotificationsService'
import * as Navigation from 'utils/Navigation'
import { ChannelId } from 'services/notifications/channels'
import AppNavigation from 'navigation/AppNavigation'
import { AppListenerEffectAPI } from 'store/index'
import { AnyAction } from '@reduxjs/toolkit'
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
      dispatch: jest.fn()
    } as unknown as AppListenerEffectAPI
    action = {
      type: 'SOME_ACTION'
    }
    jest.clearAllMocks()
  })

  it('should not prompt if user has already been prompted for balance changes', async () => {
    ;(selectHasPromptedForBalanceChange as jest.Mock).mockReturnValue(true)

    await handleMaybePromptBalanceNotification(action, listenerApi)

    expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
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
