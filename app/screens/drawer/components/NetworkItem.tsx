import React from 'react'
import AvaListItem from 'components/AvaListItem'
import AvaText from 'components/AvaText'
import AppNavigation from 'navigation/AppNavigation'
import { WalletScreenProps } from 'navigation/types'
import { useNavigation } from '@react-navigation/native'
import { useNetworkContext } from '@avalabs/wallet-react-components'

type NavigationProp = WalletScreenProps<
  typeof AppNavigation.Wallet.Drawer
>['navigation']

const NetworkItem = () => {
  const networkContext = useNetworkContext()
  const navigation = useNavigation<NavigationProp>()
  const selectedNetwork = () => (
    <AvaText.Body2 textStyle={{ paddingRight: 12 }}>
      {networkContext?.network?.name}
    </AvaText.Body2>
  )

  return (
    <>
      <AvaListItem.Base
        title={'Network'}
        titleAlignment={'flex-start'}
        rightComponent={selectedNetwork()}
        rightComponentVerticalAlignment={'center'}
        showNavigationArrow
        onPress={() => {
          navigation.navigate(AppNavigation.Wallet.NetworkSelector)
        }}
      />
    </>
  )
}

export default NetworkItem
