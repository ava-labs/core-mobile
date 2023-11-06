import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { NoWalletScreenProps } from 'navigation/types'
import CreateNewWalletPlusSVG, {
  IconWeight
} from 'components/svg/CreateNewWalletPlusSVG'
import { usePostCapture } from 'hooks/usePosthogCapture'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const CreateNewWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = usePostCapture()

  return (
    <>
      <AvaListItem.Base
        testID="create_new_wallet_item__create_new_wallet"
        title={'Create New Wallet'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={
          <CreateNewWalletPlusSVG weight={IconWeight.bold} size={18} />
        }
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          capture('OnboardingCreateNewWalletSelected')
          navigation.navigate(AppNavigation.NoWallet.Welcome, {
            screen: AppNavigation.Onboard.AnalyticsConsent,
            params: {
              nextScreen: AppNavigation.Onboard.CreateWalletStack
            }
          })
        }}
      />
    </>
  )
}

export default CreateNewWalletItem
