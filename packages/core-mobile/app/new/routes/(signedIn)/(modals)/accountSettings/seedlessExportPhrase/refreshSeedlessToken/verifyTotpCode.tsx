import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useRouter } from 'expo-router'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const { sessionData, seedlessExportService, checkPendingExports } =
    useSeedlessMnemonicExportContext()
  const router = useRouter()
  const { getState } = useNavigation()

  const handleVerifySuccess = useCallback(async (): Promise<void> => {
    dismissTotpStack(router, getState())
    checkPendingExports()
  }, [getState, checkPendingExports, router])

  const handleVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (sessionData?.oidcToken && sessionData.mfaId) {
        return seedlessExportService.session.verifyCode(
          sessionData.oidcToken,
          sessionData.mfaId,
          code
        )
      }
      return {
        success: false,
        error: new TotpErrors({
          name: 'UnexpectedError',
          message: 'Missing oidcToken or mfaId'
        })
      }
    },
    [seedlessExportService.session, sessionData?.mfaId, sessionData?.oidcToken]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={handleVerifySuccess}
    />
  )
}

export default VerifyTotpCodeScreen
