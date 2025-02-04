import BlurredBackgroundView from 'common/components/BlurredBackgroundView'
import React, { useCallback, useEffect, useState } from 'react'
import { View } from '@avalabs/k2-alpine'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useNavigation } from 'expo-router'

export const useAnimatedNavigationHeader = ({
  header,
  visibility
}: {
  header: JSX.Element
  visibility: number
}): void => {
  const navigation = useNavigation()
  const [navigationHeaderLayout, setNavigationHeaderLayout] = useState<
    LayoutRectangle | undefined
  >(undefined)

  const renderHeaderBackground = useCallback(
    () => (
      <BlurredBackgroundView
        separator={{ position: 'bottom', opacity: visibility }}
      />
    ),
    [visibility]
  )

  const handleLayout = (event: LayoutChangeEvent): void => {
    setNavigationHeaderLayout(event.nativeEvent.layout)
  }

  useEffect(() => {
    navigation.setOptions({
      headerBackground: renderHeaderBackground,
      title: (
        <View
          sx={{
            overflow: 'hidden',
            height: '100%',
            justifyContent: 'center'
          }}>
          <View
            sx={{
              opacity: visibility,
              transform: [
                {
                  translateY:
                    (navigationHeaderLayout?.height ?? 0) * (1 - visibility)
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
    visibility,
    navigationHeaderLayout
  ])
}
