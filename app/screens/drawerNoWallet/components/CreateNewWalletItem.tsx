import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { NoWalletScreenProps } from 'navigation/types'
import CreateNewWalletPlusSVG from 'components/svg/CreateNewWalletPlusSVG'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const CreateNewWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <AvaListItem.Base
        title={'Create new wallet'}
        testID="createNewWalletBtn"
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={<CreateNewWalletPlusSVG bold size={18} />}
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          navigation.navigate(AppNavigation.NoWallet.CreateWalletStack)
        }}
      />
    </>
  )
}

export default CreateNewWalletItem
