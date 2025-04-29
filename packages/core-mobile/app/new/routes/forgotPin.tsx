import { Button, Icons, Text, useTheme, View } from '@avalabs/k2-alpine'
import { ScrollScreen } from 'common/components/ScrollScreen'
import SlideToConfirm from 'common/components/SlideToConfirm'
import { useRouter } from 'expo-router'
import React, { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { useDeleteWallet } from 'new/common/hooks/useDeleteWallet'
import { selectWalletType } from 'store/app'

const ForgotPin = (): JSX.Element => {
  const router = useRouter()
  const { theme } = useTheme()
  const { deleteWallet } = useDeleteWallet()
  const walletType = useSelector(selectWalletType)

  const handleCancel = useCallback(() => {
    router.back()
  }, [router])

  const handleConfirm = useCallback(() => {
    if (
      walletType === WalletType.MNEMONIC ||
      walletType === WalletType.SEEDLESS
    ) {
      deleteWallet()
    }
  }, [deleteWallet, walletType])

  const renderFooter = useCallback(() => {
    return (
      <View sx={{ gap: 20 }}>
        <SlideToConfirm onConfirm={handleConfirm} text={'Slide to confirm'} />
        <Button
          testID="cancel_btn"
          type="tertiary"
          size="large"
          onPress={handleCancel}>
          Cancel
        </Button>
      </View>
    )
  }, [handleCancel, handleConfirm])

  return (
    <ScrollScreen
      title={`Do you want to\nreset your PIN?`}
      renderFooter={renderFooter}
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <View>
        <View
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}>
          <Icons.Alert.ErrorOutline color={theme.colors.$textDanger} />
          <Text
            variant="subtitle1"
            sx={{ color: '$textDanger', flexShrink: 1 }}>
            If you continue, the current wallet session will be terminated and
            you will need to recover your wallet using a social login or
            recovery phrase.
          </Text>
        </View>
      </View>
    </ScrollScreen>
  )
}

export default ForgotPin
