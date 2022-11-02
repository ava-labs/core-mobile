import React from 'react'
import AvaListItem from 'components/AvaListItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { NoWalletScreenProps } from 'navigation/types'
import WalletSVG from 'components/svg/WalletSVG'
import { usePosthogContext } from 'contexts/PosthogContext'

type NavigationProp = NoWalletScreenProps<
  typeof AppNavigation.NoWallet.Drawer
>['navigation']

const AccessExistingWalletItem = () => {
  const navigation = useNavigation<NavigationProp>()
  const { capture } = usePosthogContext()

  return (
    <>
      <AvaListItem.Base
        title={'Recover Wallet'}
        titleAlignment={'flex-start'}
        showNavigationArrow
        leftComponent={<WalletSVG size={18} />}
        rightComponentVerticalAlignment={'center'}
        testId="recoverWalletBtn"
        onPress={() => {
          capture('OnboardingImportWalletSelected').catch(() => undefined)
          capture('OnboardingImportMnemonicSelected').catch(() => undefined)
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
