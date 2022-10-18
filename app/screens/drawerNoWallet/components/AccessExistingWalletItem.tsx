import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { NoWalletScreenProps } from 'navigation/types'
import WalletSVG from 'components/svg/WalletSVG'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const AccessExistingWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <AvaListItem.Base
        title={'Recover Wallet'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={<WalletSVG size={18} />}
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          navigation.navigate(AppNavigation.NoWallet.EnterWithMnemonicStack)
        }}
      />
    </>
  )
}

export default AccessExistingWalletItem
