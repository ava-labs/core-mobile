import React from 'react'
import { Platform } from 'react-native'
import WatchlistCarousel from 'screens/watchlist/components/WatchlistCarousel'
import { Space } from 'components/Space'
import Animated, { FlipInEasyX, FlipOutEasyX } from 'react-native-reanimated'
import { Text } from '@avalabs/k2-mobile'
import { useNetworks } from 'hooks/networks/useNetworks'
import { selectIsBalanceLoadedForActiveNetwork } from 'store/balance/slice'
import { useSelector } from 'react-redux'
import ActiveNetworkCard from './Cards/ActiveNetworkCard/ActiveNetworkCard'
import { PortfolioActiveTokensLoader } from './Loaders/PortfolioActiveTokensLoader'

export const TokensTabHeader = (): JSX.Element => {
  const { activeNetwork } = useNetworks()
  const isBalanceLoadedForActiveNetwork = useSelector(
    selectIsBalanceLoadedForActiveNetwork
  )

  return (
    <>
      <WatchlistCarousel />
      <Text variant="heading6" sx={{ marginVertical: 16 }} testID="networks">
        Networks
      </Text>
      {!isBalanceLoadedForActiveNetwork ? (
        <PortfolioActiveTokensLoader />
      ) : (
        <Animated.View
          sharedTransitionTag={
            Platform.OS === 'ios' ? 'active-network-card' : undefined
          }
          key={activeNetwork.chainId}
          entering={FlipInEasyX.delay(300)}
          exiting={FlipOutEasyX.duration(300)}>
          <ActiveNetworkCard />
        </Animated.View>
      )}
      <Space y={16} />
    </>
  )
}
