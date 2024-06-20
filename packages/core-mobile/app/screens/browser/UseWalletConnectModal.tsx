import React, { useCallback } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { WalletScreenProps } from 'navigation/types'
import AppNavigation from 'navigation/AppNavigation'
import { Icons, useTheme, View } from '@avalabs/k2-mobile'

type ScreenProps = WalletScreenProps<
  typeof AppNavigation.Modal.UseWalletConnect
>

export const UseWalletConnectModal: () => JSX.Element = () => {
  const {
    theme: { colors }
  } = useTheme()
  const {
    params: { onContinue }
  } = useRoute<ScreenProps['route']>()
  const { goBack, canGoBack } = useNavigation()

  const handleContinue = useCallback(() => {
    onContinue()

    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack, onContinue])

  return (
    <WarningModal
      title={'Use Wallet Connect'}
      message={
        'Core uses Wallet Connect on mobile devices. Return to the dApp and tap the Wallet Connect option to continue.'
      }
      actionText={'Continue'}
      onAction={handleContinue}
      header={
        <View style={{ alignItems: 'center' }}>
          <Icons.Logos.WalletConnect color={colors.$white} />
        </View>
      }
    />
  )
}
