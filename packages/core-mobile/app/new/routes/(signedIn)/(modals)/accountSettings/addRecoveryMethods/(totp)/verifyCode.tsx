import React, { useCallback } from 'react'
import { useRouter } from 'expo-router'
import { VerifyCode as VerifyCodeComponent } from 'features/onboarding/components/VerifyCode'
import { useRecoveryMethodsContext } from 'features/accountSettings/context/RecoverMethodsProvider'
import { showSnackbar } from 'common/utils/toast'
import { Result } from 'types/result'
import { TotpErrors } from 'seedless/errors'
import { dismissTotpStack } from 'features/accountSettings/utils/dismissTotpStack'
import { useNavigation } from '@react-navigation/native'

export default function VerifyCode(): JSX.Element {
  const { verifiedTotpChallenge } = useRecoveryMethodsContext()
  const router = useRouter()
  const { getState } = useNavigation()

  const onVerifyCode = useCallback(
    async (code: string): Promise<Result<undefined, TotpErrors>> => {
      if (!verifiedTotpChallenge)
        return {
          success: false,
          error: new TotpErrors({
            name: 'UnexpectedError',
            message: 'Missing totpChallengeResponse'
          })
        }

      await verifiedTotpChallenge.answer(code)
      return { success: true, value: undefined }
    },
    [verifiedTotpChallenge]
  )

  const onVerifySuccess = useCallback((): void => {
    // dismiss totp setup stack
    router.dismissAll()
    router.back()
    // dismiss totp verify stack
    dismissTotpStack(router, getState())

    showSnackbar('Authenticator Changed')
  }, [getState, router])

  return (
    <VerifyCodeComponent
      onVerifyCode={onVerifyCode}
      onVerifySuccess={onVerifySuccess}
    />
  )
}
