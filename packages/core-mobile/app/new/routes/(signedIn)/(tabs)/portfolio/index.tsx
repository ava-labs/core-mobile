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
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'

const PortfolioHomeScreen = (): JSX.Element => {
  const accountName = 'Very long wallet name blar blar'
  const formattedBalance = '$7,377.37'
  const {
    appHook: { selectedCurrency }
  } = useApplicationContext()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const handleCopyToClipboard = (): void => {
    copyToClipboard('test')
  }

  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }

  const scrollViewProps = useFadingHeaderNavigation({
    header: (
      <NavigationTitleHeader title={accountName} subtitle={formattedBalance} />
    ),
    targetLayout: balanceHeaderLayout
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
        {...scrollViewProps}>
        <BalanceHeader
          accountName={accountName}
          formattedBalance={formattedBalance}
          currency={selectedCurrency}
          onLayout={handleBalanceHeaderLayout}
          priceChange={{
            formattedPrice: '$12.7',
            status: 'up',
            formattedPercent: '3.7%'
          }}
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
