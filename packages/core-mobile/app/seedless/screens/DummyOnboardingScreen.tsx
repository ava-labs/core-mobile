import React, { FC, useState } from 'react'
import { ActivityIndicator, View } from '@avalabs/k2-mobile'
import AvaButton from 'components/AvaButton'
import { signInWithGoogle } from 'seedless/utils/googleSignIn'
import {
  SeedlessRegistrationResult,
  approveSeedlessRegistration
} from 'seedless/utils/approveSeedlessRegistration'
import { getCubeSigner } from 'seedless/utils/getCubeSigner'
import { SignerSessionManager, envs } from '@cubist-dev/cubesigner-sdk'
import Config from 'react-native-config'
import { Space } from 'components/Space'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'

const DummyOnboardingScreen: FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>()
  async function googleSignin(): Promise<void> {
    const oidcToken = await signInWithGoogle()

    setIsLoading(true)
    const result = await approveSeedlessRegistration(oidcToken)

    if (result === SeedlessRegistrationResult.APPROVED) {
      // creating wallet flow
      try {
        const response = await getCubeSigner(oidcToken)
        const sessionInfo = response.data()
        const sessionMgr = await SignerSessionManager.createFromSessionInfo(
          envs.gamma,
          Config.SEEDLESS_ORG_ID || '',
          sessionInfo
        )
        const signerSessionData = await sessionMgr.storage.retrieve()

        navigation.navigate(AppNavigation.Onboard.CreateSeedlessWalletStack, {
          signerSessionData
        })
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      } finally {
        setIsLoading(false)
      }
    } else if (result === SeedlessRegistrationResult.ALREADY_REGISTERED) {
      // recover flow
    }
  }

  const handleSeedless = (): void => {
    googleSignin()
  }

  const handleMnemonic = (): void => {
    navigation.navigate(AppNavigation.Onboard.AnalyticsConsent, {
      nextScreen: AppNavigation.Onboard.CreateWalletStack
    })
  }

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      {isLoading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <AvaButton.SecondaryLarge onPress={handleSeedless} testID="iAgreeBtn">
            Sign up with Google
          </AvaButton.SecondaryLarge>
          <Space y={16} />
          <AvaButton.SecondaryLarge
            onPress={handleMnemonic}
            testID="noThanksBtn">
            Sign up with Recovery Phrase
          </AvaButton.SecondaryLarge>
        </>
      )}
    </View>
  )
}

export default DummyOnboardingScreen
