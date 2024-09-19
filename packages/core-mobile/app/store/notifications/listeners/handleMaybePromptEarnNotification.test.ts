import NotificationsService from 'services/notifications/NotificationsService'
import * as Navigation from 'utils/Navigation'
import { ChannelId } from 'services/notifications/channels'
import AppNavigation from 'navigation/AppNavigation'
import { handleMaybePromptEarnNotification } from 'store/notifications/listeners/handleMaybePromptEarnNotification'
import { AppListenerEffectAPI } from 'store/index'
import { AnyAction } from '@reduxjs/toolkit'
import {
  selectHasPromptedAfterFirstDelegation,
  selectNotificationSubscription,
  setHasPromptedAfterFirstDelegation
} from '../slice'

jest.mock('services/notifications/NotificationsService', () => ({
  getBlockedNotifications: jest.fn()
}))

jest.mock('utils/Navigation', () => ({
  navigate: jest.fn()
}))

jest.mock('../slice', () => ({
  selectNotificationSubscription: jest.fn(() => jest.fn),
  selectHasPromptedAfterFirstDelegation: jest.fn(),
  setHasPromptedAfterFirstDelegation: jest.fn(() => ({
    type: 'SET_HAS_PROMPTED_AFTER_FIRST_DELEGATION'
  }))
}))

function getNotificationPrompt(): {
  name: string
  params: { notificationChannel: ChannelId; title: string; message: string }
} {
  return {
    name: AppNavigation.Modal.EnableNotificationsPrompt,
    params: {
      notificationChannel: ChannelId.STAKING_COMPLETE,
      title: 'Turn on Notifications?',
      message:
        'You will be notified when staking is complete. You can change your preference in settings.'
    }
  }
}

describe('handleMaybePromptEarnNotification', () => {
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

  it('should not prompt if user has already been prompted after first delegation', async () => {
    ;(selectHasPromptedAfterFirstDelegation as jest.Mock).mockReturnValue(true)

    await handleMaybePromptEarnNotification(action, listenerApi)

    expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })

  it('should prompt if user has not been prompted and is not subscribed to staking notifications', async () => {
    const blockedNotifications = new Set()
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(blockedNotifications)
    ;(selectHasPromptedAfterFirstDelegation as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => false)

    await handleMaybePromptEarnNotification(action, listenerApi)

    expect(Navigation.navigate).toHaveBeenCalledWith(getNotificationPrompt())

    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setHasPromptedAfterFirstDelegation(true)
    )
  })

  it('should prompt if notifications for staking are blocked', async () => {
    const blockedNotifications = new Set([ChannelId.STAKING_COMPLETE])
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(blockedNotifications)
    ;(selectHasPromptedAfterFirstDelegation as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => true)

    await handleMaybePromptEarnNotification(action, listenerApi)

    expect(Navigation.navigate).toHaveBeenCalledWith(getNotificationPrompt())

    expect(listenerApi.dispatch).toHaveBeenCalledWith(
      setHasPromptedAfterFirstDelegation(true)
    )
  })

  it('should not prompt if user is already subscribed to staking notifications and they are not blocked', async () => {
    const blockedNotifications = new Set()
    ;(
      NotificationsService.getBlockedNotifications as jest.Mock
    ).mockResolvedValue(blockedNotifications)
    ;(selectHasPromptedAfterFirstDelegation as jest.Mock).mockReturnValue(false)
    ;(selectNotificationSubscription as jest.Mock).mockReturnValue(() => true)

    await handleMaybePromptEarnNotification(action, listenerApi)

    expect(Navigation.navigate).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })
})
