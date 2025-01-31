import React, { useState } from 'react'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  Button,
  SafeAreaView,
  ScrollView,
  showAlert,
  View
} from '@avalabs/k2-alpine'
import ScreenHeader from 'common/components/ScreenHeader'
import * as bip39 from 'bip39'
import AnalyticsService from 'services/analytics/AnalyticsService'
import RecoveryPhraseInput from './RecoveryPhraseInput'

export const EnterRecoveryPhrase = ({
  onNext
}: {
  onNext: (mnemonic: string) => void
}): React.JSX.Element => {
  const [mnemonic, setMnemonic] = useState('')

  function handleNext(): void {
    const trimmed = mnemonic.toLowerCase().trim()
    const isValid = bip39.validateMnemonic(trimmed)

    try {
      if (isValid) {
        AnalyticsService.capture('OnboardingMnemonicImported')
        onNext(trimmed)
      } else {
        throw new Error()
      }
    } catch (e) {
      showAlert({
        title: 'Invalid phrase',
        description:
          'The recovery phrase you entered is invalid. Please double check for spelling mistakes or the order of each word.',
        buttons: [
          {
            text: 'Dismiss',
            style: 'cancel'
          }
        ]
      })
    }
  }

  return (
    <BlurredBarsContentLayout>
      <SafeAreaView sx={{ flex: 1 }}>
        <ScrollView
          sx={{ flex: 1 }}
          contentContainerSx={{ padding: 16 }}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag">
          <ScreenHeader
            title="Enter your recovery phrase"
            description="This phrase should contain 12, 18, or 24 words. Use a space between each word."
          />
          <View sx={{ marginTop: 20 }}>
            <RecoveryPhraseInput onChangeText={setMnemonic} />
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
            disabled={!mnemonic}>
            Import
          </Button>
        </View>
      </SafeAreaView>
    </BlurredBarsContentLayout>
  )
}
