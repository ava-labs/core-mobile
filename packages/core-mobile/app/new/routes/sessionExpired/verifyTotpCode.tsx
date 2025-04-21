import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useLocalSearchParams } from 'expo-router'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'
import SeedlessService from 'seedless/services/SeedlessService'
import { useInitSeedlessWalletAndUnlock } from 'common/hooks/useInitSeedlessWalletAndUnlock'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const { initSeedlessWalletAndUnlock } = useInitSeedlessWalletAndUnlock()
  const { oidcToken, mfaId } = useLocalSearchParams<{
    oidcToken: string
    mfaId: string
  }>()
  const router = useDebouncedRouter()
  const { getState } = useNavigation()

  const handleVerifySuccess = useCallback(async (): Promise<void> => {
    await initSeedlessWalletAndUnlock()
    dismissTotpStack(router, getState()) // dismiss the mfa screens
    router.canGoBack() && router.back() // dismiss the token expired screen
  }, [getState, initSeedlessWalletAndUnlock, router])

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
