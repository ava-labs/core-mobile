import React, { useState } from 'react'
import {
  ScrollView,
  View,
  BalanceHeader,
  NavigationTitleHeader,
  useTheme,
  SegmentedControl,
  alpha
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { LayoutChangeEvent, LayoutRectangle } from 'react-native'
import { useFadingHeaderNavigation } from 'common/hooks/useFadingHeaderNavigation'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import { LinearGradient } from 'expo-linear-gradient'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import {
  selectBalanceForAccountIsAccurate,
  selectBalanceTotalInCurrencyForAccount,
  selectIsLoadingBalances,
  selectIsRefetchingBalances
} from 'store/balance'
import { selectTokenVisibility } from 'store/portfolio'
import PortfolioDefiScreen from './defi'
import PortfolioAssetsScreen from './assets'
import PortfolioCollectiblesScreen from './collectibles'

const PortfolioHomeScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const [balanceHeaderLayout, setBalanceHeaderLayout] = useState<
    LayoutRectangle | undefined
  >()
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0)
  const context = useApplicationContext()
  const activeAccount = useSelector(selectActiveAccount)
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)
  const tokenVisibility = useSelector(selectTokenVisibility)
  const balanceTotalInCurrency = useSelector(
    selectBalanceTotalInCurrencyForAccount(
      activeAccount?.index ?? 0,
      tokenVisibility
    )
  )
  const isLoading = isBalanceLoading || isRefetchingBalance
  const balanceAccurate = useSelector(
    selectBalanceForAccountIsAccurate(activeAccount?.index ?? 0)
  )
  const { selectedCurrency, currencyFormatter } = context.appHook

  const currencyBalance =
    !balanceAccurate && balanceTotalInCurrency === 0
      ? UNKNOWN_AMOUNT
      : currencyFormatter(balanceTotalInCurrency)

  const formattedBalance = currencyBalance.replace(selectedCurrency, '')
  const renderContent = (): React.JSX.Element => {
    if (selectedSegmentIndex === 2) {
      return <PortfolioCollectiblesScreen />
    } else if (selectedSegmentIndex === 1) {
      return <PortfolioDefiScreen />
    }
    return <PortfolioAssetsScreen />
  }

  const handleBalanceHeaderLayout = (event: LayoutChangeEvent): void => {
    setBalanceHeaderLayout(event.nativeEvent.layout)
  }

  const scrollViewProps = useFadingHeaderNavigation({
    header: (
      <NavigationTitleHeader
        title={activeAccount?.name ?? ''}
        subtitle={formattedBalance}
      />
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
          accountName={activeAccount?.name ?? ''}
          formattedBalance={formattedBalance}
          currency={selectedCurrency}
          onLayout={handleBalanceHeaderLayout}
          priceChange={{
            formattedPrice: '$12.7',
            status: 'up',
            formattedPercent: '3.7%'
          }}
          isLoading={isLoading}
        />
        <View sx={{ flex: 1, marginTop: 30 }}>{renderContent()}</View>
        <View>
          <LinearGradient
            colors={[alpha(colors.$surfacePrimary, 0), colors.$surfacePrimary]}
            style={{ height: 0 }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />
          <SegmentedControl
            dynamicItemWidth={false}
            items={['Assets', 'Collectibles', 'DeFi']}
            selectedSegmentIndex={selectedSegmentIndex}
            onSelectSegment={setSelectedSegmentIndex}
          />
        </View>
        <View />
      </ScrollView>
    </BlurredBarsContentLayout>
  )
}

export default PortfolioHomeScreen
