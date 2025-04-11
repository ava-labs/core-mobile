import {
  AddFidoChallenge,
  Empty,
  TotpChallenge
} from '@cubist-labs/cubesigner-sdk'
import { useVerifyRecoveryMethods } from 'common/hooks/useVerifyRecoveryMethods'
import { showSnackbar } from 'common/utils/toast'
import SeedlessService from 'seedless/services/SeedlessService'
import Logger from 'utils/Logger'

function useSeedlessManageMFA(): {
  totpResetInit: (
    onInitialized: (challenge: TotpChallenge) => void,
    verifyMfaPath: string
  ) => Promise<void>
  fidoRegisterInit: (
    name: string,
    onInitialized: (challenge: AddFidoChallenge) => Promise<void>,
    verifyMfaPath: string
  ) => Promise<void>
  fidoDelete: (
    fidoId: string,
    onDelete: () => void,
    verifyMfaPath: string
  ) => Promise<void>
} {
  const { verifyMFA } = useVerifyRecoveryMethods(SeedlessService.session)

  async function totpResetInit(
    onInitialized: (challenge: TotpChallenge) => void,
    verifyMfaPath: string
  ): Promise<void> {
    try {
      const totpResetInitResponse =
        await SeedlessService.session.totpResetInit()

      if (totpResetInitResponse.requiresMfa()) {
        const handleVerifySuccess: HandleVerifyMfaSuccess<
          TotpChallenge
        > = async totpChallenge => {
          onInitialized(totpChallenge)
        }

        verifyMFA({
          response: totpResetInitResponse,
          verifyMfaPath,
          onVerifySuccess: handleVerifySuccess
        })
      } else {
        const totpChallenge = totpResetInitResponse.data()

        onInitialized(totpChallenge)
      }
    } catch (e) {
      Logger.error('totpResetInit error', e)
      showSnackbar('Unable to reset totp. Please try again.')
    }
  }

  async function fidoRegisterInit(
    name: string,
    onInitialized: (challenge: AddFidoChallenge) => Promise<void>,
    verifyMfaPath: string
  ): Promise<void> {
    try {
      const fidoRegisterInitResponse =
        await SeedlessService.session.fidoRegisterInit(name)

      if (fidoRegisterInitResponse.requiresMfa()) {
        const handleVerifySuccess: HandleVerifyMfaSuccess<
          AddFidoChallenge
        > = async addFidoChallenge => {
          onInitialized(addFidoChallenge)
        }

        verifyMFA({
          response: fidoRegisterInitResponse,
          onVerifySuccess: handleVerifySuccess,
          verifyMfaPath
        })
      } else {
        const addFidoChallenge = fidoRegisterInitResponse.data()

        onInitialized(addFidoChallenge)
      }
    } catch (e) {
      Logger.error('fidoRegisterInit error', e)
      showSnackbar('Unable to reset totp. Please try again.')
    }
  }

  async function fidoDelete(
    fidoId: string,
    onDelete: () => void,
    verifyMfaPath: string
  ): Promise<void> {
    const fidoDeleteResponse = await SeedlessService.session.deleteFido(fidoId)

    if (fidoDeleteResponse.requiresMfa()) {
      const handleVerifySuccess: HandleVerifyMfaSuccess<Empty> = async () => {
        onDelete()
      }

      verifyMFA({
        response: fidoDeleteResponse,
        onVerifySuccess: handleVerifySuccess,
        excludeFidoMfaId: fidoId,
        verifyMfaPath
      })
    } else {
      throw new Error('fidoDelete requires MFA')
    }
  }

  return {
    fidoDelete,
    totpResetInit,
    fidoRegisterInit
  }
}

type HandleVerifyMfaSuccess<T> = (response: T) => Promise<void>

export default useSeedlessManageMFA
