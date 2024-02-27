import { CubeSignerResponse } from '@cubist-labs/cubesigner-sdk'
import { useNavigation } from '@react-navigation/native'
import { showSimpleToast } from 'components/Snackbar'
import AppNavigation from 'navigation/AppNavigation'
import {
  RootScreenStackParamList,
  RootStackScreenProps
} from 'navigation/types'
import { TotpErrors } from 'seedless/errors'
import SeedlessSessionManager from 'seedless/services/SeedlessSessionManager'
import { MFA } from 'seedless/types'
import PasskeyService from 'services/passkey/PasskeyService'
import { Result } from 'types/result'
import Logger from 'utils/Logger'

function useVerifyMFA(sessionManager: SeedlessSessionManager): {
  verifyMFA: VerifyMFAFunction
  verifyTotp: VerifyTotpFunction
  verifyFido: VerifyFidoFunction
} {
  const { navigate } =
    useNavigation<
      RootStackScreenProps<keyof RootScreenStackParamList>['navigation']
    >()

  const handleMfa = async <T>(
    mfa: MFA,
    response: CubeSignerResponse<T>,
    onVerifySuccess: (response: T) => void
  ): Promise<void> => {
    if (mfa.type === 'totp') {
      verifyTotp({
        onVerifyCode: async code => {
          return sessionManager.verifyApprovalCode(response, code)
        },
        onVerifySuccess: (res?: T) => {
          if (res) {
            onVerifySuccess(res)
          }
        }
      })
    } else if (mfa.type === 'fido') {
      verifyFido({
        response,
        onVerifySuccess
      })
    }
  }

  const verifyMFA: VerifyMFAFunction = async <T>({
    response,
    onVerifySuccess
  }: {
    response: CubeSignerResponse<T>
    onVerifySuccess: (response: T) => void
  }) => {
    const mfaMethods = await sessionManager.userMfa()

    if (mfaMethods.length === 0) {
      Logger.error(`verifyMFA: No MFA methods available`)
      showSimpleToast(`No MFA methods available`)
    } else if (mfaMethods.length === 1) {
      if (mfaMethods[0]) {
        handleMfa(mfaMethods[0], response, onVerifySuccess)
      }
    } else {
      navigate(AppNavigation.Root.SelectRecoveryMethods, {
        mfaMethods,
        onMFASelected: mfa => {
          handleMfa(mfa, response, onVerifySuccess)
        }
      })
    }
  }

  const verifyTotp: VerifyTotpFunction = async <T>({
    onVerifyCode,
    onVerifySuccess
  }: {
    onVerifyCode: (
      code: string
    ) => Promise<Result<CubeSignerResponse<T> | undefined, TotpErrors>>
    onVerifySuccess: (response?: T) => void
  }) => {
    navigate(AppNavigation.Root.VerifyTotpCode, {
      // @ts-ignore
      onVerifyCode: onVerifyCode,
      // @ts-ignore
      onVerifySuccess: onVerifySuccess
    })
  }

  const verifyFido: VerifyFidoFunction = async <T>({
    response,
    onVerifySuccess
  }: {
    response: CubeSignerResponse<T>
    onVerifySuccess: (response: T) => void
  }) => {
    const challenge = await sessionManager.fidoApproveStart(response.mfaId())
    const credential = await PasskeyService.authenticate(
      challenge.options,
      true
    )
    const mfaRequestInfo = await challenge.answer(credential)
    if (!mfaRequestInfo.receipt?.confirmation) {
      throw new Error('FIDO authentication failed')
    }
    const signedResponse = await SeedlessSessionManager.signWithMfaApproval(
      response,
      mfaRequestInfo.receipt.confirmation
    )

    onVerifySuccess(signedResponse.data())
  }

  return {
    verifyMFA,
    verifyTotp,
    verifyFido
  }
}

type VerifyMFAFunction = <T>({
  response,
  onVerifySuccess
}: {
  response: CubeSignerResponse<T>
  onVerifySuccess: (response: T) => void
}) => Promise<void>

type VerifyTotpFunction = <T>({
  onVerifyCode,
  onVerifySuccess
}: {
  onVerifyCode: (
    code: string
  ) => Promise<Result<CubeSignerResponse<T> | undefined, TotpErrors>>
  onVerifySuccess: (response?: T) => void
}) => void

type VerifyFidoFunction = <T>({
  response,
  onVerifySuccess
}: {
  response: CubeSignerResponse<T>
  onVerifySuccess: (response: T) => void
}) => Promise<void>

export default useVerifyMFA
