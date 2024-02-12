import { CubeSignerResponse } from '@cubist-labs/cubesigner-sdk'
import { useNavigation, useRoute } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RootStackScreenProps } from 'navigation/types'
import React from 'react'
import { TotpErrors } from 'seedless/errors'
import { VerifyCode } from 'seedless/screens/VerifyCode'
import { Result } from 'types/result'

type VerifyCodeScreenProps = RootStackScreenProps<
  typeof AppNavigation.Root.VerifyTotpCode
>

function VerifyTotpCodeScreen(): JSX.Element {
  const { goBack } = useNavigation<VerifyCodeScreenProps['navigation']>()
  const { params } = useRoute<VerifyCodeScreenProps['route']>()

  function handleOnVerifySuccess<T>(cubeSignerResponse?: T): void {
    goBack()

    params.onVerifySuccess(cubeSignerResponse)
  }

  function handleOnBack(): void {
    params.onBack?.()
    goBack()
  }

  function handleOnVerifyCode<T>(
    code: string
  ): Promise<Result<undefined | CubeSignerResponse<T>, TotpErrors>> {
    return params.onVerifyCode(code)
  }

  return (
    <VerifyCode
      onVerifyCode={handleOnVerifyCode}
      onVerifySuccess={handleOnVerifySuccess}
      onBack={handleOnBack}
    />
  )
}

export default VerifyTotpCodeScreen
