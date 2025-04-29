import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'
import { Space } from 'components/Space'
import NotificationToggle from 'features/accountSettings/components/NotificationToggle'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import NotificationsService from 'services/notifications/NotificationsService'
import { selectAppState } from 'store/app'
import { setNotificationSubscriptions } from 'store/notifications'
import {
  selectIsAllNotificationsBlocked,
  selectIsEarnBlocked
} from 'store/posthog'
import Logger from 'utils/Logger'

const NotificationPreferencesScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const dispatch = useDispatch()
  const [showAllowPushNotificationsCard, setShowAllowPushNotificationsCard] =
    useState(false)
  const [blockedChannels, setBlockedChannels] = useState(
    new Map<ChannelId, boolean>()
  )
  const appState = useSelector(selectAppState)
  const isEarnBlocked = useSelector(selectIsEarnBlocked)
  const isAllNotificationsBlocked = useSelector(selectIsAllNotificationsBlocked)

  const disabledChannels = useMemo(() => {
    return {
      [ChannelId.BALANCE_CHANGES]: isAllNotificationsBlocked,
      [ChannelId.STAKING_COMPLETE]: isAllNotificationsBlocked || isEarnBlocked,
      [ChannelId.PRODUCT_ANNOUNCEMENTS]: isAllNotificationsBlocked,
      [ChannelId.OFFERS_AND_PROMOTIONS]: isAllNotificationsBlocked,
      [ChannelId.MARKET_NEWS]: isAllNotificationsBlocked,
      [ChannelId.PRICE_ALERTS]: isAllNotificationsBlocked
    }
  }, [isAllNotificationsBlocked, isEarnBlocked])

  const onEnterSettings = (): void => {
    // enable all channels that are not disabled
    notificationChannels
      .filter(channel => {
        return !disabledChannels[channel.id]
      })
      .forEach(channel => {
        dispatch(setNotificationSubscriptions([channel.id, true]))
      })
    NotificationsService.getAllPermissions().catch(Logger.error)
  }

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
    return notificationChannels
      .filter(ch => {
        return !disabledChannels[ch.id]
      })
      .map(ch => {
        return (
          <NotificationToggle
            key={ch.id}
            channel={ch}
            isSystemDisabled={blockedChannels.has(ch.id)}
          />
        )
      })
  }, [blockedChannels, disabledChannels])

  return (
    <ScrollViewScreenTemplate
      title={`Notification\npreferences`}
      navigationTitle="Notification preferences"
      // hasParent
      isModal
      contentContainerStyle={{
        padding: 16
      }}>
      {showAllowPushNotificationsCard && (
        <View sx={{ gap: 12, marginBottom: 8 }}>
          <View
            sx={{
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              marginRight: 64
            }}>
            <Icons.Alert.ErrorOutline
              color={colors.$textDanger}
              width={20}
              height={20}
            />
            <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
              To receive push notifications from Core, your first need to allow
              notifications in your device settings
            </Text>
          </View>
          <Button
            size="small"
            type="secondary"
            onPress={onEnterSettings}
            style={{ width: 165, marginLeft: 30 }}>
            Open device settings
          </Button>
        </View>
      )}
      <Space y={16} />
      <View sx={{ gap: 12 }}>{renderNotificationToggles()}</View>
    </ScrollViewScreenTemplate>
  )
}

export default NotificationPreferencesScreen
