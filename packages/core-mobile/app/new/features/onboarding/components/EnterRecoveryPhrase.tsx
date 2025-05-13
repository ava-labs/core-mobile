import { Button, showAlert, View } from '@avalabs/k2-alpine'
import * as bip39 from 'bip39'
import { ScrollScreen } from 'common/components/ScrollScreen'
import React, { useCallback, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletSDK from 'utils/WalletSDK'
import RecoveryPhraseInput from './RecoveryPhraseInput'

export const EnterRecoveryPhrase = ({
  onNext
}: {
  onNext: (mnemonic: string) => void
}): React.JSX.Element => {
  const [mnemonic, setMnemonic] = useState('')
  const testMnemonic = WalletSDK.testMnemonic()

  const handleNext = useCallback(() => {
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
            text: 'Dismiss'
          }
        ]
      })
    }
  }, [mnemonic, onNext])

  const handleEnterTestWallet = useCallback(() => {
    onNext(testMnemonic)
  }, [onNext, testMnemonic])

  const renderFooter = useCallback(() => {
    return (
      <View
        sx={{
          gap: 12
        }}>
        {__DEV__ && bip39.validateMnemonic(testMnemonic) && (
          <Button size="large" type="tertiary" onPress={handleEnterTestWallet}>
            Enter Test Wallet
          </Button>
        )}
        <Button
          size="large"
          type="primary"
          onPress={handleNext}
          disabled={
            !mnemonic ||
            mnemonic.trim().split(/\s+/).length < MINIMUM_MNEMONIC_WORDS
          }>
          Import
        </Button>
      </View>
    )
  }, [handleEnterTestWallet, handleNext, mnemonic, testMnemonic])

  return (
    <ScrollScreen
      showNavigationHeaderTitle={false}
      disableStickyFooter
      title={'Enter your\nrecovery phrase'}
      subtitle="This phrase should contain 12, 18, or 24 words. Use a space between each word."
      contentContainerStyle={{ padding: 16 }}
      renderFooter={renderFooter}>
      <View
        style={{
          marginTop: 24
        }}>
        <RecoveryPhraseInput onChangeText={setMnemonic} />
      </View>
    </ScrollScreen>
  )
}

const MINIMUM_MNEMONIC_WORDS = 12
