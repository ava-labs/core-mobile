// import { SignedInStackProps } from 'navigation-new/types'
import React, { useCallback, useEffect, useLayoutEffect } from 'react'
import { View } from 'react-native'
import { Link, useNavigation } from 'expo-router'

const useHomeScreenHeader = (): void => {
  const navigation = useNavigation()
  const renderHeaderLeft = useCallback(
    () => (
      <View style={{ marginLeft: 12 }}>
        <Link href="/signedIn/settings/">Settings</Link>
      </View>
    ),
    []
  )

  const renderHeaderRight = useCallback(
    () => (
      <View style={{ flexDirection: 'row', gap: 12, marginRight: 12 }}>
        <Link href="/signedIn/receive/">Receive</Link>
        <Link href="/signedIn/notifications/">Notifications</Link>
      </View>
    ),
    []
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: renderHeaderLeft,
      headerRight: renderHeaderRight,
      title: '',
      headerShadowVisible: false
    })
  }, [navigation, renderHeaderLeft, renderHeaderRight])
}

export default useHomeScreenHeader
