import React, { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import WarningModal from 'components/WarningModal'
import { Icons, useTheme, View } from '@avalabs/k2-mobile'

export const UseWalletConnectModal: () => JSX.Element = () => {
  const {
    theme: { colors }
  } = useTheme()
  const { goBack, canGoBack } = useNavigation()

  const handleContinue = useCallback(() => {
    if (canGoBack()) {
      goBack()
    }
  }, [canGoBack, goBack])

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
