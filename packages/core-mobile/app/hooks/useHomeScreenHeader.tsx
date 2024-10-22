import React, { useCallback, useLayoutEffect } from 'react'
import { View } from 'react-native'
import { Link, useNavigation } from 'expo-router'

const useHomeScreenHeader = (): void => {
  const navigation = useNavigation()
  const renderHeaderLeft = useCallback(
    () => (
      <View style={{ marginLeft: 12 }}>
        <Link href="/settings/">Account</Link>
      </View>
    ),
    []
  )

  const renderHeaderRight = useCallback(
    () => (
      <View style={{ flexDirection: 'row', gap: 12, marginRight: 12 }}>
        <Link href="/receive/">Receive</Link>
        <Link href="/notifications/">Notifications</Link>
      </View>
    ),
    []
  )

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: renderHeaderLeft,
      headerRight: renderHeaderRight
    })
  }, [navigation, renderHeaderLeft, renderHeaderRight])
}

export default useHomeScreenHeader
