import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useCallback, useEffect, useState } from 'react'
import { View } from '@avalabs/k2-alpine'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewProps
} from 'react-native'
import { useNavigation } from 'expo-router'
import { clamp } from 'react-native-reanimated'

export const useFadingHeaderNavigation = ({
  header,
  targetLayout
}: {
  header?: JSX.Element
  targetLayout?: LayoutRectangle
}): Partial<ScrollViewProps> => {
  const navigation = useNavigation()
  const [navigationHeaderLayout, setNavigationHeaderLayout] = useState<
    LayoutRectangle | undefined
  >(undefined)
  const [targetHiddenProgress, setTargetHiddenProgress] = useState(0) // from 0 to 1, 0 = fully hidden, 1 = fully shown

  const renderHeaderBackground = useCallback(
    () => (
      <BlurredBackgroundView
        separator={{ position: 'bottom', opacity: targetHiddenProgress }}
      />
    ),
    [targetHiddenProgress]
  )

  const handleLayout = (event: LayoutChangeEvent): void => {
    setNavigationHeaderLayout(event.nativeEvent.layout)
  }

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    if (targetLayout) {
      setTargetHiddenProgress(
        // calculate balance header's visibility based on the scroll position
        clamp(
          event.nativeEvent.contentOffset.y /
            (targetLayout.y + targetLayout.height),
          0,
          1
        )
      )
    }
  }

  useEffect(() => {
    navigation.setOptions({
      headerBackground: renderHeaderBackground,
      title: header && (
        <View
          sx={{
            overflow: 'hidden',
            height: '100%',
            justifyContent: 'center'
          }}>
          <View
            sx={{
              opacity: targetHiddenProgress,
              transform: [
                {
                  translateY:
                    (navigationHeaderLayout?.height ?? 0) *
                    (1 - targetHiddenProgress)
                }
              ]
            }}
            onLayout={handleLayout}>
            {header}
          </View>
        </View>
      )
    })
  }, [
    navigation,
    header,
    renderHeaderBackground,
    targetHiddenProgress,
    navigationHeaderLayout
  ])

  return { onScroll: handleScroll, scrollEventThrottle: 16 }
}
