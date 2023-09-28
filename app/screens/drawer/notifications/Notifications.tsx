import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AvaListItem from 'components/AvaListItem'
import Switch from 'components/Switch'
import { useDispatch, useSelector } from 'react-redux'
import AvaText from 'components/AvaText'
import { Space } from 'components/Space'
import AvaButton from 'components/AvaButton'
import { selectAppState } from 'store/app'
import {
  selectNotificationSubscription,
  setNotificationSubscriptions,
  turnOffNotificationsFor,
  turnOnNotificationsFor
} from 'store/notifications'
import NotificationsService from 'services/notifications/NotificationsService'
import {
  AvaxAndroidChannel,
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import { selectIsEarnBlocked } from 'store/posthog'
import Logger from 'utils/Logger'

/**
 * Conceptual description of notification handling works can be found here
 * https://ava-labs.atlassian.net/wiki/spaces/EN/pages/2372927490/Managing+Notifications
 */
const Notifications = () => {
  const [showAllowPushNotificationsCard, setShowAllowPushNotificationsCard] =
    useState(false)
  const [blockedChannels, setBlockedChannels] = useState(
    new Map<ChannelId, boolean>()
  )
  const appState = useSelector(selectAppState)
  const isEarnBlocked = useSelector(selectIsEarnBlocked)

  useEffect(() => {
    if (appState === 'active') {
      NotificationsService.getBlockedNotifications()
        .then(value => {
          setShowAllowPushNotificationsCard(value.size !== 0)
          setBlockedChannels(value)
        })
        .catch(Logger.error)
    }
  }, [appState]) //switching to system settings and coming back must re-initiate settings check

  const renderNotificationToggles = useCallback(() => {
    return notificationChannels.map(ch => {
      return (
        <NotificationToggle
          key={ch.id}
          channel={ch}
          isSystemDisabled={blockedChannels.has(ch.id)}
        />
      )
    })
  }, [blockedChannels])

  return (
    <View style={{ marginTop: 20 }}>
      {showAllowPushNotificationsCard && <AllowPushNotificationsCard />}
      {!isEarnBlocked && renderNotificationToggles()}
    </View>
  )
}

function NotificationToggle({
  channel,
  isSystemDisabled
}: {
  channel: AvaxAndroidChannel
  isSystemDisabled: boolean
}) {
  const { theme } = useApplicationContext()
  const inAppEnabled = useSelector(selectNotificationSubscription(channel.id))
  const checked = !isSystemDisabled && inAppEnabled
  const dispatch = useDispatch()

  async function onChange(isChecked: boolean) {
    // before we change the state, we need to check if the system settings allow us to do so
    const { permission } = await NotificationsService.getAllPermissions(false)
    if (permission !== 'authorized') {
      Logger.error('Notifications permission not granted')
      return
    }

    if (isChecked) {
      dispatch(
        turnOnNotificationsFor({
          channelId: channel.id
        })
      )
    } else {
      dispatch(turnOffNotificationsFor({ channelId: channel.id }))
    }
  }

  return (
    <AvaListItem.Base
      disabled={isSystemDisabled}
      title={channel.title}
      subtitle={channel.subtitle}
      background={theme.background}
      rightComponent={<Switch value={checked} onValueChange={onChange} />}
    />
  )
}

function AllowPushNotificationsCard() {
  const { theme } = useApplicationContext()
  const dispatch = useDispatch()

  function onEnterSettings() {
    notificationChannels.forEach(channel => {
      dispatch(setNotificationSubscriptions([channel.id, true]))
    })
    NotificationsService.getAllPermissions()
  }

  return (
    <View
      style={{
        backgroundColor: theme.neutral850,
        borderRadius: 8,
        marginHorizontal: 16,
        padding: 16,
        marginBottom: 40
      }}>
      <AvaText.Heading6>Allow Push Notifications</AvaText.Heading6>
      <Space y={8} />
      <AvaText.Subtitle2 textStyle={{ color: theme.colorText3 }}>
        To start receiving notifications from Core, please turn on “Allow
        Notifications” in your device settings.
      </AvaText.Subtitle2>
      <Space y={16} />
      <AvaButton.SecondaryLarge onPress={onEnterSettings}>
        Open Device Settings
      </AvaButton.SecondaryLarge>
    </View>
  )
}

export default Notifications
