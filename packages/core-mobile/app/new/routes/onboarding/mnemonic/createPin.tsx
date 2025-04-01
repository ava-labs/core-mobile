import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'

export default function CreatePin(): JSX.Element {
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { navigate } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()

  const handleEnteredValidPin = (pin: string): void => {
    if (!mnemonic) {
      return
    }

    AnalyticsService.capture('OnboardingPasswordSet')
    onPinCreated(mnemonic, pin, false)
      .then(() => {
        navigate({ pathname: './setWalletName', params: { mnemonic } })
      })
      .catch(Logger.error)
  }
  return (
    <BlurredBarsContentLayout sx={{ marginTop: 16 }}>
      <KeyboardAvoidingView>
        <Component
          onEnteredValidPin={handleEnteredValidPin}
          useBiometrics={useBiometrics}
          setUseBiometrics={setUseBiometrics}
          newPinTitle={`Secure your wallet\nwith a PIN`}
          newPinDescription="For extra security, avoid choosing a PIN that contains repeating digits in a sequential order"
          confirmPinTitle={`Confirm your\nPIN code`}
        />
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
