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

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView sx={{ flex: 1 }} contentContainerSx={{ padding: 16 }}>
          <ScreenHeader
            title="Here is your wallet's recovery phrase"
            description="This phrase is your access key to your wallet. Carefully write it
              down and store it in a safe location"
          />
          <View sx={{ marginTop: 16, gap: 16 }}>
            <View sx={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icons.Alert.ErrorOutline color={theme.colors.$textDanger} />
              <Text variant="subtitle1" sx={{ color: '$textDanger' }}>
                Losing this phrase will result in lost funds
              </Text>
            </View>
            <MnemonicScreen isLoading={isLoading} mnemonic={mnemonic} />
          </View>
        </ScrollView>
        <View
          sx={{
            padding: 16,
            backgroundColor: '$surfacePrimary'
          }}>
          <Button
            size="large"
            type="primary"
            onPress={handleNext}
            disabled={isLoading}>
            Next
          </Button>
        </View>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
