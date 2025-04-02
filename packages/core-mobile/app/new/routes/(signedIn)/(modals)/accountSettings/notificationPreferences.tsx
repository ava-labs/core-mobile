import {
  Icons,
  NavigationTitleHeader,
  Text,
  ScrollView,
  useTheme,
  View,
  Button
} from '@avalabs/k2-alpine'
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import ScreenHeader from 'common/components/ScreenHeader'
import {
  ChannelId,
  notificationChannels
} from 'services/notifications/channels'
import { useDispatch, useSelector } from 'react-redux'
import { selectAppState } from 'store/app'
import {
  selectIsAllNotificationsBlocked,
  selectIsEarnBlocked
} from 'store/posthog'
import { setNotificationSubscriptions } from 'store/notifications'
import NotificationsService from 'services/notifications/NotificationsService'
import Logger from 'utils/Logger'
import NotificationToggle from 'features/accountSettings/components/NotificationToggle'
import { Space } from 'components/Space'

const navigationHeader = (
  <NavigationTitleHeader title={'Notification preferences'} />
)

const NotificationPreferencesScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const headerOpacity = useSharedValue(1)
  const [headerLayout, setHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const { onScroll, targetHiddenProgress } = useFadingHeaderNavigation({
    header: navigationHeader,
    targetLayout: headerLayout,
    shouldHeaderHaveGrabber: true
  })

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: 1 - targetHiddenProgress.value
  }))

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }
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
    <ScrollView
      onScroll={onScroll}
      contentContainerSx={{
        paddingBottom: 60,
        paddingHorizontal: 16
      }}
      showsVerticalScrollIndicator={false}>
      <Animated.View
        style={[{ opacity: headerOpacity }, animatedHeaderStyle]}
        onLayout={handleHeaderLayout}>
        <ScreenHeader title={`Notification\npreferences`} />
      </Animated.View>
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
    </ScrollView>
  )
}

export default NotificationPreferencesScreen
