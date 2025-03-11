import React, { useEffect, useState } from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import DeviceInfo from 'react-native-device-info'
import { Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { DebugScreenProps } from 'navigation/types'
import { isDebugOrInternalBuild } from 'utils/Utils'

type DebugNavigationProp = DebugScreenProps<
  typeof AppNavigation.Debug.Menu
>['navigation']

export default function VersionItem(): React.JSX.Element {
  const version = DeviceInfo.getReadableVersion()
  const [tapCount, setTapCount] = useState(0)
  const [showDebugMenu, setShowDebugMenu] = useState(false)
  const navigation = useNavigation<DebugNavigationProp>()

  // Reset tap count after 2 seconds of inactivity
  useEffect(() => {
    if (tapCount === 0) return

    const timeout = setTimeout(() => {
      setTapCount(0)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [tapCount])

  const handleVersionPress = (): void => {
    if (!isDebugOrInternalBuild()) return

    const newCount = tapCount + 1
    setTapCount(newCount)

    if (newCount === 5) {
      setShowDebugMenu(true)
      setTapCount(0)
    }
  }

  useEffect(() => {
    if (showDebugMenu) {
      navigation.navigate(AppNavigation.Debug.Menu)
      setShowDebugMenu(false)
    }
  }, [navigation, showDebugMenu])

  return (
    <>
      <AvaListItem.Base
        disabled={!isDebugOrInternalBuild()}
        title={'Version'}
        titleAlignment={'flex-start'}
        leftComponent={null}
        rightComponent={
          <Pressable onPress={handleVersionPress}>
            <AvaText.Body2 testID="version_item__app_version">
              {version}
            </AvaText.Body2>
          </Pressable>
        }
        rightComponentVerticalAlignment={'center'}
        testID="version_item__version"
      />
    </>
  )
}
