import React, { useCallback } from 'react'
import { VerifyCode } from 'features/onboarding/components/VerifyCode'
import { TotpErrors } from 'seedless/errors'
import { Result } from 'types/result'
import { useSeedlessMnemonicExportContext } from 'features/accountSettings/context/SeedlessMnemonicExportProvider'
import { useRouter } from 'expo-router'
import { UserExportInitResponse } from '@cubist-labs/cubesigner-sdk'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'

const VerifyTotpCodeScreen = (): React.JSX.Element => {
  const {
    seedlessExportService,
    userExportInitResponse,
    onVerifyExportInitSuccess
  } = useSeedlessMnemonicExportContext()
  const router = useRouter()
  const { getState } = useNavigation()

  const handleVerifySuccess = useCallback(
    (response: UserExportInitResponse): void => {
      dismissTotpStack(router, getState())
      onVerifyExportInitSuccess(response)
    },
    [getState, onVerifyExportInitSuccess, router]
  )

  const handleVerifyCode = useCallback(
    async (
      code: string
    ): Promise<Result<UserExportInitResponse, TotpErrors>> => {
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
    [seedlessExportService.session, userExportInitResponse]
  )

  return (
    <VerifyCode
      onVerifyCode={handleVerifyCode}
      onVerifySuccess={response =>
        handleVerifySuccess(response as UserExportInitResponse)
      }
    />
  )
}

export default VerifyTotpCodeScreen
