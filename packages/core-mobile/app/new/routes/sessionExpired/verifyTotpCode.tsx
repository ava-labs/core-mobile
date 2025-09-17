import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'
import SeedlessService from 'seedless/services/SeedlessService'
import { useWallet } from 'hooks/useWallet'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const { unlock } = useWallet()
  const { oidcToken, mfaId } = useLocalSearchParams<{
    oidcToken: string
    mfaId: string
  }>()
  const router = useRouter()
  const { getState } = useNavigation()

  const handleVerifySuccess = useCallback(async (): Promise<void> => {
    await unlock()
    dismissTotpStack(router, getState()) // dismiss the mfa screens
    router.canGoBack() && router.back() // dismiss the token expired screen
  }, [getState, unlock, router])

  const handleVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (oidcToken && mfaId) {
        return SeedlessService.session.verifyCode(oidcToken, mfaId, code)
      }
      return {
        success: false,
        error: new TotpErrors({
          name: 'UnexpectedError',
          message: 'Missing oidcToken or mfaId'
        })
      }
    },
    [mfaId, oidcToken]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={handleVerifySuccess}
    />
  )
}

export default VerifyTotpCodeScreen
