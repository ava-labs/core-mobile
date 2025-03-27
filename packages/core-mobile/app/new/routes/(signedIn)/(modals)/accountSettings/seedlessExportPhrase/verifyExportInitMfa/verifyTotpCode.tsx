import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useRouter } from 'expo-router'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const {
    seedlessExportService,
    userExportInitResponse,
    onVerifyExportInitSuccess,
    setPendingRequest
  } = useSeedlessMnemonicExportContext()
  const { dismissAll, canGoBack, back } = useRouter()

  const handleVerifySuccess = useCallback((): void => {
    dismissAll()
    canGoBack() && back()
    onVerifyExportInitSuccess()
  }, [back, canGoBack, dismissAll, onVerifyExportInitSuccess])

  const handleVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (!userExportInitResponse)
        return {
          success: false,
          error: new TotpErrors({
            name: 'UnexpectedError',
            message: 'Missing userExportInitResponse'
          })
        }
      const result = await seedlessExportService.session.verifyApprovalCode(
        userExportInitResponse,
        code
      )
      if (result.success) {
        setPendingRequest(result.value.data())
        return {
          success: result.success,
          value: undefined
        }
      }
      return {
        success: result.success,
        error: result.error
      }
    },
    [seedlessExportService.session, setPendingRequest, userExportInitResponse]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={handleVerifySuccess}
    />
  )
}

export default VerifyTotpCodeScreen
