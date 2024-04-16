import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { Platform, View } from 'react-native'
import AvaButton from 'components/AvaButton'
import WatchlistCarousel from 'screens/watchlist/components/WatchlistCarousel'
import { Space } from 'components/Space'
import Animated, { FlipInEasyX, FlipOutEasyX } from 'react-native-reanimated'
import { Text } from '@avalabs/k2-mobile'
import { useNetworks } from 'hooks/networks/useNetworks'
import ActiveNetworkCard from './Cards/ActiveNetworkCard/ActiveNetworkCard'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

export const TokensTabHeader = (): JSX.Element => {
  const { theme } = useApplicationContext()
  const { activeNetwork } = useNetworks()
  const { navigate } = useNavigation<NavigationProp>()
  const viewAllBtnColor = theme.colorPrimary1

  const goToWatchList = (): void => {
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
        <Text variant="heading6" testID="favorites">
          Favorites
        </Text>
        <AvaButton.TextLink
          testID="viewAll"
          style={{ paddingRight: -16 }}
          textColor={viewAllBtnColor}
          onPress={goToWatchList}>
          View All
        </AvaButton.TextLink>
      </View>
      <WatchlistCarousel />
      <Text variant="heading6" sx={{ marginVertical: 16 }} testID="networks">
        Networks
      </Text>
      <Animated.View
        sharedTransitionTag={
          Platform.OS === 'ios' ? 'active-network-card' : undefined
        }
        key={activeNetwork.chainId}
        entering={FlipInEasyX.delay(300)}
        exiting={FlipOutEasyX.duration(300)}>
        <ActiveNetworkCard />
      </Animated.View>
      <Space y={16} />
    </>
  )
}
