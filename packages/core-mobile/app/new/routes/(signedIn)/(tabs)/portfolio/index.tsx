import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Button,
  BalanceHeader,
  NavigationTitleHeader
} from '@avalabs/k2-alpine'
import { Link } from 'expo-router'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { copyToClipboard } from 'common/utils/clipboard'
import {
  LayoutChangeEvent,
  LayoutRectangle,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import { useAnimatedNavigationHeader } from 'common/hooks/useAnimatedNavigationHeader'
import { clamp } from 'react-native-reanimated'
import { useApplicationContext } from 'contexts/ApplicationContext'

const PortfolioHomeScreen = (): JSX.Element => {
  const accountName = 'Account 1'
  const formattedBalance = '$7,377.37'
  const {
    appHook: { selectedCurrency }
  } = useApplicationContext()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [balanceHeaderHiddenProgress, setBalanceHeaderHiddenProgress] =
    useState(0) // from 0 to 1, 0 = fully hidden, 1 = fully shown

  const handleCopyToClipboard = (): void => {
    copyToClipboard('test')
  }

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ): void => {
    if (balanceHeaderLayout) {
      setBalanceHeaderHiddenProgress(
        // calculate balance header's visibility based on the scroll position
        clamp(
          event.nativeEvent.contentOffset.y /
            (balanceHeaderLayout.y + balanceHeaderLayout.height),
          0,
          1
        )
      )
    }
  }

  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }

  useAnimatedNavigationHeader({
    visibilityProgress: balanceHeaderHiddenProgress,
    header: (
      <NavigationTitleHeader title={accountName} subtitle={formattedBalance} />
    )
  })

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
        <BalanceHeader
          accountName={accountName}
          formattedBalance={formattedBalance}
          currency={selectedCurrency}
          onLayout={handleBalanceHeaderLayout}
        />
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
