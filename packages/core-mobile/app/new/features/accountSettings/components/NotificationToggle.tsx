import React, { useCallback, memo, useMemo } from 'react'
import { useTheme, View, Text, Toggle } from '@avalabs/k2-alpine'
import { useDispatch, useSelector } from 'react-redux'
import { AvaxAndroidChannel } from 'services/notifications/channels'
import {
  selectNotificationSubscription,
  turnOffNotificationsFor,
  turnOnNotificationsFor
} from 'store/notifications'

const NotificationToggle = ({
  channel,
  isSystemDisabled
}: {
  channel: AvaxAndroidChannel
  isSystemDisabled: boolean
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const inAppEnabled = useSelector(selectNotificationSubscription(channel.id))
  const isEnabled = useMemo(
    () => inAppEnabled && !isSystemDisabled,
    [inAppEnabled, isSystemDisabled]
  )
  const dispatch = useDispatch()

  const onValueChange = useCallback(
    async (isChecked: boolean): Promise<void> => {
      if (isChecked) {
        dispatch(
          turnOnNotificationsFor({
            channelId: channel.id
          })
        )
      } else {
        dispatch(turnOffNotificationsFor({ channelId: channel.id }))
      }
    },
    [dispatch, channel.id]
  )
  return (
    <View
      sx={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: colors.$surfaceSecondary
      }}>
      <View>
        <Text
          variant="body1"
          sx={{
            lineHeight: 22,
            color: colors.$textPrimary
          }}>
          {channel.title}
        </Text>
        <Text
          variant="subtitle2"
          sx={{
            lineHeight: 18,
            color: colors.$textSecondary
          }}>
          {channel.subtitle}
        </Text>
      </View>
      <Toggle
        testID={
          isEnabled
            ? `${channel.title}_enabled_switch`
            : `${channel.title}_disabled_switch`
        }
        onValueChange={onValueChange}
        value={isEnabled}
        disabled={isSystemDisabled}
      />
    </View>
  )
}

export default memo(NotificationToggle)
