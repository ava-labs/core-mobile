import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import AnalyticsService from 'services/analytics/AnalyticsService'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const LegalItem = (): JSX.Element => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <AvaListItem.Base
        title={'Legal'}
        showNavigationArrow
        onPress={() => {
          AnalyticsService.capture('LegalClicked')
          navigation.navigate(AppNavigation.Wallet.Legal, {
            screen: AppNavigation.Legal.Legal
          })
        }}
      />
    </>
  )
}

export default LegalItem
