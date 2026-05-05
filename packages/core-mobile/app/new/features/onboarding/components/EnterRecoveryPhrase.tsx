import { Button, showAlert, View } from '@avalabs/k2-alpine'
import * as bip39 from 'bip39'
import { OnboardingWizardFooter } from 'common/components/OnboardingWizardFooter'
import { ScrollScreen } from 'common/components/ScrollScreen'
import { useAfterScreenEnterTransition } from 'common/hooks/useAfterScreenEnterTransition'
import { TextInput } from 'react-native'
import React, { useCallback, useRef, useState } from 'react'
import AnalyticsService from 'services/analytics/AnalyticsService'
import WalletSDK from 'utils/WalletSDK'
import { MINIMUM_MNEMONIC_WORDS } from 'common/consts'
import RecoveryPhraseInput from './RecoveryPhraseInput'

type EnterRecoveryPhraseProps = {
  onNext: (mnemonic: string) => void
  wizardStep?: { currentStep: number; totalSteps: number }
}

export function EnterRecoveryPhrase({
  onNext,
  wizardStep
}: EnterRecoveryPhraseProps): React.JSX.Element {
  const recoveryPhraseInputRef = useRef<TextInput>(null)
  const [mnemonic, setMnemonic] = useState('')
  const testMnemonic = WalletSDK.testMnemonic()

  useAfterScreenEnterTransition(() => recoveryPhraseInputRef.current?.focus())

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

  const isInvalid =
    !mnemonic ||
    mnemonic.trim().split(/\s+/).length < MINIMUM_MNEMONIC_WORDS

  const renderFooter = useCallback(() => {
    if (wizardStep) {
      return (
        <View sx={{ gap: 12 }}>
          {__DEV__ && bip39.validateMnemonic(testMnemonic) && (
            <Button
              size="large"
              type="tertiary"
              onPress={handleEnterTestWallet}>
              Enter Test Wallet
            </Button>
          )}
          <OnboardingWizardFooter
            currentStep={wizardStep.currentStep}
            totalSteps={wizardStep.totalSteps}
            onNext={handleNext}
            disabled={isInvalid}
            testID="import_btn"
          />
        </View>
      )
    }
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
          testID="import_btn"
          size="large"
          type="primary"
          onPress={handleNext}
          disabled={isInvalid}>
          Import
        </Button>
      </View>
    )
  }, [
    handleEnterTestWallet,
    handleNext,
    isInvalid,
    testMnemonic,
    wizardStep
  ])

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
        <RecoveryPhraseInput
          ref={recoveryPhraseInputRef}
          onChangeText={setMnemonic}
        />
      </View>
    </ScrollScreen>
  )
}
