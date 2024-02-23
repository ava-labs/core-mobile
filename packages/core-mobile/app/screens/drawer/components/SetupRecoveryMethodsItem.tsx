import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { useNavigation } from '@react-navigation/native'
import { View } from '@avalabs/k2-mobile'
import { ShowSnackBar } from 'components/Snackbar'
import { SnackBarMessage } from 'seedless/components/SnackBarMessage'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

export default function SetupRecoveryMethodsItem(): JSX.Element {
  const { navigate } = useNavigation<NavigationProp>()

  const icon = (): JSX.Element => {
    return (
      <View sx={{ padding: 6, marginRight: -8 }}>
        <View
          sx={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '$blueMain'
          }}
        />
      </View>
    )
  }

  const handleAccountVerified = (withMfa: boolean): void => {
    if (withMfa) {
      ShowSnackBar(
        <SnackBarMessage message="Recovery methods added successfully" />
      )
    }
  }

  function handlePress(): void {
    navigate(AppNavigation.Root.RecoveryMethods, {
      screen: AppNavigation.RecoveryMethods.AddRecoveryMethods,
      params: {
        onAccountVerified: handleAccountVerified
      }
    })
  }

  return (
    <AvaListItem.Base
      title="Set Up Recovery Methods"
      showNavigationArrow
      rightComponentVerticalAlignment="center"
      leftComponent={icon()}
      onPress={handlePress}
    />
  )
}
