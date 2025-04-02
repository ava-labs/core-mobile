import { CubeSignerResponse } from '@cubist-labs/cubesigner-sdk'
import { useNavigation } from '@react-navigation/native'
import { showSimpleToast } from 'components/Snackbar'
import AppNavigation from 'navigation/AppNavigation'
import {
  RootScreenStackParamList,
  RootStackScreenProps
} from 'navigation/types'
import { TotpErrors } from 'seedless/errors'
import SeedlessSession from 'seedless/services/SeedlessSession'
import { MFA } from 'seedless/types'
import PasskeyService from 'services/passkey/PasskeyService'
import { Result } from 'types/result'
import Logger from 'utils/Logger'

function useVerifyMFA(session: SeedlessSession): {
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
          return session.verifyApprovalCode(response, code)
        },
        onVerifySuccess: (res?: T) => {
          if (res) {
            onVerifySuccess(res)
          }
        }
      })
    } else if (mfa.type === 'fido') {
      const mfaId = response.mfaId()

      if (!mfaId) {
        throw new Error('MFA ID is missing')
      }

      verifyFido({
        mfaId,
        response,
        onVerifySuccess
      })
    }
  }

  const verifyMFA: VerifyMFAFunction = async <T>({
    response,
    onVerifySuccess,
    excludeFidoMfaId
  }: {
    response: CubeSignerResponse<T>
    onVerifySuccess: (response: T) => void
    excludeFidoMfaId?: string
  }) => {
    let mfaMethods = await session.userMfa()

    if (excludeFidoMfaId) {
      mfaMethods = mfaMethods.filter(
        mfa => mfa.type === 'totp' || mfa.id !== excludeFidoMfaId
      )
    }

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
    // @ts-ignore
    navigate(AppNavigation.Root.VerifyTotpCode, {
      onVerifyCode: onVerifyCode,
      onVerifySuccess: onVerifySuccess
    })
  }

  const verifyFido: VerifyFidoFunction = async <T>({
    mfaId,
    response,
    onVerifySuccess
  }: {
    mfaId: string
    response: CubeSignerResponse<T>
    onVerifySuccess: (response: T) => void
  }) => {
    const challenge = await session.fidoApproveStart(mfaId)
    const credential = await PasskeyService.getCredential(
      challenge.options,
      true
    )
    const mfaRequestInfo = await challenge.answer(credential)
    const mfaReceipt = await mfaRequestInfo.receipt()
    if (!mfaReceipt?.mfaConf) {
      throw new Error('FIDO authentication failed')
    }
    const signedResponse = await SeedlessSession.signWithMfaApproval(
      mfaId,
      response,
      mfaReceipt.mfaConf
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
  onVerifySuccess,
  excludeFidoMfaId
}: {
  response: CubeSignerResponse<T>
  onVerifySuccess: (response: T) => void
  excludeFidoMfaId?: string
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
  mfaId,
  response,
  onVerifySuccess
}: {
  mfaId: string
  response: CubeSignerResponse<T>
  onVerifySuccess: (response: T) => void
}) => Promise<void>

export default useVerifyMFA
