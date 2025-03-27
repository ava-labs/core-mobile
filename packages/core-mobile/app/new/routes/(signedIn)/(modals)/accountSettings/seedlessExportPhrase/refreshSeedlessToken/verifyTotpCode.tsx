import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useRouter } from 'expo-router'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const { sessionData, seedlessExportService, checkPendingExports } =
    useSeedlessMnemonicExportContext()
  const { canGoBack, back, dismissAll } = useRouter()

  const handleVerifySuccess = async (): Promise<void> => {
    dismissAll()
    canGoBack() && back()
    checkPendingExports()
  }

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
