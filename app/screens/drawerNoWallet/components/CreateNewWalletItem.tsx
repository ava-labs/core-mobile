import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { NoWalletScreenProps } from 'navigation/types'
import CreateNewWalletPlusSVG from 'components/svg/CreateNewWalletPlusSVG'
import { usePosthogContext } from 'contexts/PosthogContext'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const CreateNewWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = usePosthogContext()

  return (
    <>
      <AvaListItem.Base
        title={'Create New Wallet'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={<CreateNewWalletPlusSVG bold size={18} />}
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          capture('OnboardingCreateNewWalletSelected').catch(() => undefined)
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
