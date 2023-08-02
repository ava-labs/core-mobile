import React, { useEffect, useState } from 'react'
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
  selectNotifyStakingComplete,
  setNotifyStakingComplete
} from 'store/notifications'
import NotificationsService from 'services/notifications/NotificationsService'

const Notifications = () => {
  const [notificationsAllowed, setNotificationsAllowed] = useState(false)
  const appState = useSelector(selectAppState)

  useEffect(() => {
    if (appState === 'active') {
      NotificationsService.getPermission().then(permission => {
        setNotificationsAllowed(permission === 'authorized')
      })
    }
  }, [appState]) //switching to system settings and coming back must re-initiate settings check

  function enterSettings() {
    NotificationsService.openSystemSettings()
  }

  return (
    <View style={{ marginTop: 20 }}>
      {!notificationsAllowed && (
        <Notification onEnterSettings={enterSettings} />
      )}
      <EarnToggle enabled={notificationsAllowed} />
    </View>
  )
}

function EarnToggle({ enabled }: { enabled: boolean }) {
  const { theme } = useApplicationContext()
  const earnChecked = useSelector(selectNotifyStakingComplete)
  const checked = enabled && earnChecked
  const dispatch = useDispatch()

  function onChange(value: boolean) {
    dispatch(setNotifyStakingComplete(value))
  }

  return (
    <AvaListItem.Base
      disabled={!enabled}
      title={'Stake'}
      subtitle={'Staking Complete'}
      background={theme.background}
      rightComponent={<Switch value={checked} onValueChange={onChange} />}
    />
  )
}

function Notification({ onEnterSettings }: { onEnterSettings: () => void }) {
  const { theme } = useApplicationContext()
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
