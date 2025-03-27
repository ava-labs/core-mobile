import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const {
    seedlessExportService,
    userExportCompleteResponse,
    onVerifyExportCompleteSuccess,
    setExportCompleteRequest
  } = useSeedlessMnemonicExportContext()

  const handleVerifySuccess = (): void => {
    onVerifyExportCompleteSuccess()
  }

  const handleVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (!userExportCompleteResponse)
        return {
          success: false,
          error: new TotpErrors({
            name: 'UnexpectedError',
            message: 'Missing userExportCompleteResponse'
          })
        }
      const result = await seedlessExportService.session.verifyApprovalCode(
        userExportCompleteResponse,
        code
      )
      if (result.success) {
        setExportCompleteRequest(result.value.data())
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
    [
      seedlessExportService.session,
      setExportCompleteRequest,
      userExportCompleteResponse
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
