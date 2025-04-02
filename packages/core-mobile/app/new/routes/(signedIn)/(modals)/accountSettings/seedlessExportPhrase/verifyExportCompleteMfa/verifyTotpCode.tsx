import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useRouter } from 'expo-router'
import { UserExportCompleteResponse } from '@cubist-labs/cubesigner-sdk'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const {
    seedlessExportService,
    userExportCompleteResponse,
    onVerifyExportCompleteSuccess
  } = useSeedlessMnemonicExportContext()
  const router = useRouter()
  const { getState } = useNavigation()

  const handleVerifySuccess = useCallback(
    (response: UserExportCompleteResponse): void => {
      dismissTotpStack(router, getState())
      onVerifyExportCompleteSuccess(response)
    },
    [getState, onVerifyExportCompleteSuccess, router]
  )

  const handleVerifyCode = useCallback(
    async (
      code: string
    ): Promise<Result<UserExportCompleteResponse, TotpErrors>> => {
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
        return {
          success: result.success,
          value: result.value.data()
        }
      }
      return {
        success: result.success,
        error: result.error
      }
    },
    [seedlessExportService.session, userExportCompleteResponse]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={response =>
        handleVerifySuccess(response as UserExportCompleteResponse)
      }
    />
  )
}

export default VerifyTotpCodeScreen
