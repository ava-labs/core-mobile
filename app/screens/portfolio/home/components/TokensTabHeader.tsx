import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AppNavigation from 'navigation/AppNavigation'
import { PortfolioScreenProps } from 'navigation/types'
import { View } from 'react-native'
import AvaText from 'components/AvaText'
import AvaButton from 'components/AvaButton'
import WatchlistCarrousel from 'screens/watchlist/components/WatchlistCarrousel'
import { Space } from 'components/Space'
import ActiveNetworkCard from './Cards/ActiveNetworkCard/ActiveNetworkCard'

type NavigationProp = PortfolioScreenProps<
  typeof AppNavigation.Portfolio.Portfolio
>['navigation']

export const TokensTabHeader = () => {
  const { theme } = useApplicationContext()
  const { navigate } = useNavigation<NavigationProp>()
  const viewAllBtnColor = theme.colorPrimary1

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
        <AvaText.Heading3>Favorites</AvaText.Heading3>
        <AvaButton.TextLink
          style={{ paddingRight: -16 }}
          textColor={viewAllBtnColor}
          onPress={goToWatchList}>
          View All
        </AvaButton.TextLink>
      </View>
      <WatchlistCarrousel />
      <AvaText.Heading3 textStyle={{ marginVertical: 16 }}>
        Networks
      </AvaText.Heading3>
      <ActiveNetworkCard />
      <Space y={16} />
    </>
  )
}
