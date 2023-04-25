import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { Platform, View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import WatchlistCarrousel from 'screens/watchlist/components/WatchlistCarrousel'
import { Space } from 'components/Space'
import Animated, { FlipInEasyX, FlipOutEasyX } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectActiveNetwork } from 'store/network'
import ActiveNetworkCard from './Cards/ActiveNetworkCard/ActiveNetworkCard'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

export const TokensTabHeader = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const viewAllBtnColor = theme.colorPrimary1
  const network = useSelector(selectActiveNetwork)

  const goToWatchList = () => {
    navigate(AppNavigation.Tabs.Watchlist)
  }

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
        <AvaText.Heading3 testID="favorites">Favorites</AvaText.Heading3>
        <AvaButton.TextLink
          testID="viewAll"
          style={{ paddingRight: -16 }}
          textColor={viewAllBtnColor}
          onPress={goToWatchList}>
          View All
        </AvaButton.TextLink>
      </View>
      <WatchlistCarrousel />
      <AvaText.Heading3 textStyle={{ marginVertical: 16 }} testID="networks">
        Networks
      </AvaText.Heading3>
      <Animated.View
        sharedTransitionTag={
          Platform.OS === 'ios' ? 'active-network-card' : undefined
        }
        key={network.chainId}
        entering={FlipInEasyX.delay(300)}
        exiting={FlipOutEasyX.duration(300)}>
        <ActiveNetworkCard />
      </Animated.View>
      <Space y={16} />
    </>
  )
}
