import { CubeSignerResponse } from '@cubist-labs/cubesigner-sdk'
import { showSnackbar } from 'common/utils/toast'
import { useRouter } from 'expo-router'
import SeedlessSession from 'seedless/services/SeedlessSession'
import PasskeyService from 'services/passkey/PasskeyService'
import Logger from 'utils/Logger'
import { useCallback } from 'react'

function useVerifyMFA(session: SeedlessSession): {
  verifyMFA: VerifyMFAFunction
  verifyFido: VerifyFidoFunction
} {
  const { navigate } = useRouter()

  const verifyFido: VerifyFidoFunction = useCallback(
    async <T>({
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
    },
    [session]
  )

  const verifyMFA: VerifyMFAFunction = useCallback(
    async <T>({
      response,
      verifyMfaPath,
      onVerifySuccess,
      excludeFidoMfaId
    }: {
      response: CubeSignerResponse<T>
      verifyMfaPath: string
      onVerifySuccess: (response: T) => void
      excludeFidoMfaId?: string
      // eslint-disable-next-line sonarjs/cognitive-complexity
    }) => {
      let mfaMethods = await session.userMfa()

      if (excludeFidoMfaId) {
        mfaMethods = mfaMethods.filter(
          mfa => mfa.type === 'totp' || mfa.id !== excludeFidoMfaId
        )
      }

      if (mfaMethods.length === 0) {
        Logger.error(`verifyMFA: No MFA methods available`)
        showSnackbar(`No MFA methods available`)
      } else if (mfaMethods.length === 1) {
        if (mfaMethods[0]) {
          if (mfaMethods[0].type === 'totp') {
            navigate(`./${verifyMfaPath}/verifyTotpCode`)
            return
          }
          if (mfaMethods[0].type === 'fido') {
            const mfaId = response.mfaId()

            if (!mfaId) {
              throw new Error('MFA ID is missing')
            }
            await verifyFido({
              mfaId,
              response,
              onVerifySuccess
            })
            return
          }
        }
      } else {
        navigate(`./${verifyMfaPath}/selectMfaMethod`)
      }
    },
    [session, navigate, verifyFido]
  )

  return {
    verifyMFA,
    verifyFido
  }
}

type VerifyMFAFunction = <T>({
  response,
  verifyMfaPath,
  onVerifySuccess,
  excludeFidoMfaId
}: {
  response: CubeSignerResponse<T>
  verifyMfaPath: string
  onVerifySuccess: (response: T) => void
  excludeFidoMfaId?: string
}) => Promise<void>

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
