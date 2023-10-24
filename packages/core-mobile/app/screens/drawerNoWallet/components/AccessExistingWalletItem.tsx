import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { NoWalletScreenProps } from 'navigation/types'
import WalletSVG from 'components/svg/WalletSVG'
import { usePostCapture } from 'hooks/usePosthogCapture'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const AccessExistingWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = usePostCapture()

  return (
    <>
      <AvaListItem.Base
        testID="access_existing_wallet_item__recover_wallet"
        title={'Recover Wallet'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={<WalletSVG size={18} />}
        rightComponentVerticalAlignment={'center'}
        onPress={() => {
          capture('OnboardingImportWalletSelected')
          capture('OnboardingImportMnemonicSelected')
          navigation.navigate(AppNavigation.NoWallet.Welcome, {
            screen: AppNavigation.Onboard.AnalyticsConsent,
            params: {
              nextScreen: AppNavigation.Onboard.EnterWithMnemonicStack
            }
          })
        }}
      />
    </>
  )
}

export default AccessExistingWalletItem
