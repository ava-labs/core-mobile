import React from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  Button,
  Icons,
  SafeAreaView,
  ScrollView,
  showAlert,
  Text,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import MnemonicScreen from 'features/onboarding/components/MnemonicPhrase'
import ScreenHeader from 'common/components/ScreenHeader'
import { ScrollViewScreenTemplate } from 'common/components/ScrollViewScreenTemplate'

export const RecoveryPhrase = ({
  onNext,
  mnemonic,
  isLoading
}: {
  onNext: () => void
  mnemonic: string
  isLoading: boolean
}): React.JSX.Element => {
  const { theme } = useTheme()

  function handleNext(): void {
    showAlert({
      title: 'Security warning',
      description:
        'For your security, you should not screenshot your recovery phrase. It is best to write it down and store it in a secure location.',
      buttons: [
        {
          text: 'Dismiss',
          style: 'cancel',
          onPress: onNext
        }
      ]
    })
  }

  const renderFooter = (): React.ReactNode => {
    return (
      <Button
        size="large"
        type="primary"
        onPress={handleNext}
        disabled={isLoading}>
        Next
      </Button>
    )
  }

  return (
    <ScrollViewScreenTemplate
      renderFooter={renderFooter}
      title="Here is your wallet's recovery phrase"
      contentContainerStyle={{ padding: 16, flex: 1 }}>
      <Text variant="body1">
        This phrase is your access key to your wallet. Carefully write it down
        and store it in a safe location
      </Text>
      <View sx={{ marginTop: 16, gap: 16 }}>
        <View sx={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icons.Alert.ErrorOutline color={theme.colors.$textDanger} />
          <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
            Losing this phrase will result in lost funds
          </Text>
        </View>
        <MnemonicScreen isLoading={isLoading} mnemonic={mnemonic} />
      </View>
    </ScrollViewScreenTemplate>
  )
}
