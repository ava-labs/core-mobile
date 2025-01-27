import React, { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useOnboardingContext } from 'features/onboarding/contexts/OnboardingProvider'
import Logger from 'utils/Logger'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { useWallet } from 'hooks/useWallet'
import { SEEDLESS_MNEMONIC_STUB } from 'seedless/consts'

export default function CreatePin(): JSX.Element {
  const { hasWalletName } = useOnboardingContext()
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { navigate } = useRouter()
  const { onPinCreated } = useWallet()

  const handleEnteredValidPin = useCallback(
    (pin: string) => {
      AnalyticsService.capture('OnboardingPasswordSet')

      /**
       * we are using a dummy mnemonic here
       * even though we are creating a seedless wallet.
       * this allows our pin/biometric logic to work normally
       */

      // TODO: use a random string instead of a constant
      onPinCreated(SEEDLESS_MNEMONIC_STUB, pin, false)
        .then(() => {
          if (hasWalletName) {
            navigate('./selectAvatar')
          } else {
            navigate('./setWalletName')
          }
        })
        .catch(Logger.error)
    },
    [hasWalletName, navigate, onPinCreated]
  )

  return (
    <Component
      onEnteredValidPin={handleEnteredValidPin}
      useBiometrics={useBiometrics}
      setUseBiometrics={setUseBiometrics}
    />
  )
}
