import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  View,
  Button,
  BalanceHeader,
  NavigationTitleHeader
} from '@avalabs/k2-alpine'
import { Link, useNavigation } from 'expo-router'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { copyToClipboard } from 'common/utils/clipboard'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  View as RNView
} from 'react-native'
import BlurredBackgroundView from 'common/components/BlurredBackgroundView'

const PortfolioHomeScreen = (): JSX.Element => {
  const navigation = useNavigation()
  const accountName = 'Account 1'
  const formattedBalance = '$7,377.37'
  const targetRef = useRef<RNView>(null)
  const [headerLayout, setHeaderLayout] = useState<LayoutRectangle | undefined>(
    undefined
  )
  const [navigationHeaderLayout, setNavigationHeaderLayout] = useState<
    LayoutRectangle | undefined
  >(undefined)
  const [headerVisibility, setHeaderVisibility] = useState<number>(1)

  const handleCopyToClipboard = (): void => {
    copyToClipboard('test')
  }

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    if (headerLayout) {
      setHeaderVisibility(
        Math.max(
          Math.min(
            1 -
              event.nativeEvent.contentOffset.y /
                (headerLayout.y + headerLayout.height),
            1
          ),
          0
        )
      )
    }
  }

  const handleNavigationHeaderLayout = (event: LayoutChangeEvent): void => {
    setNavigationHeaderLayout(event.nativeEvent.layout)
  }

  const handleHeaderLayout = (event: LayoutChangeEvent): void => {
    setHeaderLayout(event.nativeEvent.layout)
  }

  const renderHeaderBackground = useCallback(() => {
    return (
      <BlurredBackgroundView
        separator={{ position: 'bottom', opacity: 1 - headerVisibility }}
      />
    )
  }, [headerVisibility])

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
              opacity: 1 - headerVisibility,
              transform: [
                {
                  translateY:
                    (navigationHeaderLayout?.height ?? 0) * headerVisibility
                }
              ]
            }}
            onLayout={handleNavigationHeaderLayout}>
            <NavigationTitleHeader
              title={accountName}
              subtitle={formattedBalance}
            />
          </View>
        </View>
      )
    })
  }, [
    navigation,
    headerVisibility,
    navigationHeaderLayout,
    renderHeaderBackground
  ])

  return (
    <BlurredBarsContentLayout>
      <ScrollView
        contentContainerSx={{
          paddingTop: 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          gap: 16
        }}
        scrollEventThrottle={16}
        onScroll={handleScroll}>
        <View ref={targetRef} onLayout={handleHeaderLayout}>
          <BalanceHeader
            accountName={accountName}
            formattedBalance={formattedBalance}
            currency="USD"
          />
        </View>
        <View sx={{ height: 800 }} />
        <Link href="/portfolio/assets" asChild>
          <Button type="primary" size="medium">
            Go to Portfolio Assets
          </Button>
        </Link>
        <Button type="primary" size="medium" onPress={handleCopyToClipboard}>
          Copy "test" to clipboard
        </Button>
        <View
          sx={{
            height: 800,
            width: 200,
            backgroundColor: 'orange',
            alignSelf: 'center'
          }}
        />
        <View />
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioHomeScreen
