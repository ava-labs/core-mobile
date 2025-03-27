import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useRouter } from 'expo-router'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const {
    seedlessMnemonicExportData,
    seedlessExportService,
    checkPendingExports
  } = useSeedlessMnemonicExportContext()
  const { canGoBack, back, dismissAll } = useRouter()

  const handleVerifySuccess = async (): Promise<void> => {
    dismissAll()
    canGoBack() && back()
    checkPendingExports()
  }

  const handleVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (
        seedlessMnemonicExportData?.oidcToken &&
        seedlessMnemonicExportData.mfaId
      ) {
        return seedlessExportService.session.verifyCode(
          seedlessMnemonicExportData.oidcToken,
          seedlessMnemonicExportData.mfaId,
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
    [
      seedlessExportService.session,
      seedlessMnemonicExportData?.mfaId,
      seedlessMnemonicExportData?.oidcToken
    ]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={handleVerifySuccess}
    />
  )
}

export default VerifyTotpCodeScreen
