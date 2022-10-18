import React from 'react'
import { useNavigation } from '@react-navigation/native'
import AvaButton from 'components/AvaButton'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const SignOutItem = () => {
  const navigation = useNavigation<NavigationProp>()

  return (
    <AvaButton.SecondaryLarge
      style={{ margin: 16 }}
      onPress={() => navigation.navigate(AppNavigation.Modal.SignOut)}>
      Delete Wallet
    </AvaButton.SecondaryLarge>
  )
}

export default SignOutItem
