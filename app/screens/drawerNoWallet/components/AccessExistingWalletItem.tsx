import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import WalletSVG from 'components/svg/WalletSVG'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const AccessExistingWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <AvaListItem.Base
        title={'Access existing wallet'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={<WalletSVG size={18} />}
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          navigation.navigate(AppNavigation.Onboard.EnterWithMnemonicStack)
        }}
      />
    </>
  )
}

export default AccessExistingWalletItem
