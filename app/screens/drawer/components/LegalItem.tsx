import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { WalletScreenProps } from 'navigation/types'
import { usePostCapture } from 'hooks/usePosthogCapture'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const LegalItem = () => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = usePostCapture()
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
