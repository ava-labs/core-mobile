import { useNavigation } from '@react-navigation/native'
import { SignedInStackProps } from 'navigation-new/types'
import React, { useCallback, useEffect } from 'react'
import SettingsBarButton from 'components/SettingsBarButton'
import ReceiveBarButton from 'components/ReceiveBarButton'
import NotificationBarButton from 'components/NotificationBarButton'
import { View } from '@avalabs/k2-alpine'

const useTabHomeHeader = (): void => {
  const navigation = useNavigation<SignedInStackProps['navigation']>()

  const renderHeaderLeft = useCallback(
    () => (
      <View sx={{ marginLeft: 12 }}>
        <SettingsBarButton
          onPress={() => {
            navigation.navigate('SettingsStack')
          }}
        />
      </View>
    ),
    [navigation]
  )

  const renderHeaderRight = useCallback(
    () => (
      <View sx={{ flexDirection: 'row', gap: 12, marginRight: 12 }}>
        <ReceiveBarButton
          onPress={() => {
            navigation.navigate('ReceiveStack')
          }}
        />
        <NotificationBarButton
          onPress={() => {
            navigation.navigate('NotificationsStack')
          }}
        />
      </View>
    ),
    [navigation]
  )

  useEffect(() => {
    navigation.setOptions({
      headerLeft: renderHeaderLeft,
      headerRight: renderHeaderRight,
      title: '',
      headerShadowVisible: false
    })
  }, [navigation, renderHeaderLeft, renderHeaderRight])
}

export default useTabHomeHeader
