import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import { useAnalytics } from 'hooks/useAnalytics'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const LegalItem = (): JSX.Element => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = useAnalytics()
  return (
    <>
      <AvaListItem.Base
        title={'Legal'}
        showNavigationArrow
        onPress={() => {
          capture('LegalClicked')
          navigation.navigate(AppNavigation.Wallet.Legal, {
            screen: AppNavigation.Legal.Legal
          })
        }}
      />
    </>
  )
}

export default LegalItem
