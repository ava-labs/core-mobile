import React from 'react'
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  Icons,
  useTheme
} from '@avalabs/k2-alpine'
import BlurredBarsContentLayout from 'new/components/navigation/BlurredBarsContentLayout'
import { useRouter } from 'expo-router'
import SlideToConfirm from 'new/components/SlideToConfirm'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { selectWalletType } from 'store/app'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { setPinRecovery } from 'utils/Navigation'

const ForgotPin = (): JSX.Element => {
  const router = useRouter()
  const { theme } = useTheme()
  const { signOut } = useApplicationContext().appHook
  const walletType = useSelector(selectWalletType)

  const handleCancel = (): void => {
    router.back()
  }

  const handleConfirm = (): void => {
    if (walletType === WalletType.MNEMONIC) {
      signOut()
    } else if (walletType === WalletType.SEEDLESS) {
      setPinRecovery(true)
      signOut()
    }
  }

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView contentContainerSx={{ padding: 16, flex: 1 }}>
          <View sx={{ flexGrow: 1 }}>
            <Text variant="heading2" sx={{ marginBottom: 14 }}>
              {`Do you want to\nreset your PIN?`}
            </Text>
            <View
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8
              }}>
              <Icons.Alert.IconErrorOutline color={theme.colors.$textDanger} />
              <Text
                variant="subtitle1"
                sx={{ color: '$textDanger', flexShrink: 1 }}>
                If you continue, the current wallet session will be terminated
                and you will need to recover your wallet using a social login or
                recovery phrase.
              </Text>
            </View>
          </View>
        </ScrollView>
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
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}

export default ForgotPin