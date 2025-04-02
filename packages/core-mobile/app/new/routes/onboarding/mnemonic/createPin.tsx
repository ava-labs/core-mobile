import React, { useCallback, useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CreatePin as Component } from 'features/onboarding/components/CreatePin'
import { useWallet } from 'hooks/useWallet'
import AnalyticsService from 'services/analytics/AnalyticsService'
import Logger from 'utils/Logger'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { KeyboardAvoidingView } from 'common/components/KeyboardAvoidingView'
import BiometricsSDK from 'utils/BiometricsSDK'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'

export default function CreatePin(): JSX.Element {
  const [useBiometrics, setUseBiometrics] = useState(true)
  const { navigate } = useRouter()
  const { mnemonic } = useLocalSearchParams<{ mnemonic: string }>()
  const { onPinCreated } = useWallet()
  const [isBiometricAvailable, setIsBiometricAvailable] =
    useState<boolean>(false)

  const handleEnteredValidPin = useCallback(
    (pin: string): void => {
      if (!mnemonic) {
        return
      }
      AnalyticsService.capture('OnboardingPasswordSet')
      onPinCreated(mnemonic, pin, false)
        .then(() => {
          if (useBiometrics) {
            BiometricsSDK.storeWalletWithBiometry(mnemonic)
          }
          navigate({ pathname: './setWalletName', params: { mnemonic } })
        })
        .catch(Logger.error)
    },
    [mnemonic, navigate, onPinCreated, useBiometrics]
  )

  useEffect(() => {
    BiometricsSDK.canUseBiometry()
      .then((biometricAvailable: boolean) => {
        setIsBiometricAvailable(biometricAvailable)
      })
      .catch(Logger.error)

    const type = commonStorage.getString(StorageKey.SECURE_ACCESS_SET)
    if (type) {
      setUseBiometrics(type === 'BIO')
    } else {
      Logger.error('Secure access type not found')
    }
  }, [])

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
          isBiometricAvailable={isBiometricAvailable}
        />
      </KeyboardAvoidingView>
    </BlurredBarsContentLayout>
  )
}
